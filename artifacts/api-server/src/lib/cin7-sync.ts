import { db } from "@workspace/db";
import {
  retailersTable,
  productsTable,
  saleOrdersTable,
  saleOrderLinesTable,
  cin7SyncStateTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  getCin7CredentialsFromEnv,
  listProducts,
  listCustomers,
  listSales,
  getSaleDetail,
  type Cin7Credentials,
} from "./cin7-client";

async function markSyncState(resource: string, patch: Partial<typeof cin7SyncStateTable.$inferInsert>) {
  await db
    .insert(cin7SyncStateTable)
    .values({ resource, ...patch })
    .onConflictDoUpdate({ target: cin7SyncStateTable.resource, set: patch });
}

export async function syncProducts(creds: Cin7Credentials) {
  let count = 0;
  try {
    await markSyncState("products", { status: "running", lastError: null });

    for await (const p of listProducts(creds)) {
      await db
        .insert(productsTable)
        .values({
          cin7ProductId: p.ID,
          sku: p.SKU,
          name: p.Name,
          category: p.Category ?? null,
          brand: p.Brand ?? null,
          landedCost: p.AverageCost != null ? String(p.AverageCost) : null,
          listPrice: p.PriceTier1 != null ? String(p.PriceTier1) : null,
          isActive: (p.Status ?? "Active").toLowerCase() !== "inactive",
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: productsTable.cin7ProductId,
          set: {
            sku: p.SKU,
            name: p.Name,
            category: p.Category ?? null,
            brand: p.Brand ?? null,
            landedCost: p.AverageCost != null ? String(p.AverageCost) : null,
            listPrice: p.PriceTier1 != null ? String(p.PriceTier1) : null,
            isActive: (p.Status ?? "Active").toLowerCase() !== "inactive",
            syncedAt: new Date(),
          },
        });
      count += 1;
    }

    await markSyncState("products", { status: "idle", lastSyncedAt: new Date(), recordsSynced: count });
  } catch (err) {
    await markSyncState("products", { status: "error", lastError: String(err) });
    throw err;
  }
  return count;
}

export async function syncRetailers(creds: Cin7Credentials) {
  let count = 0;
  try {
    await markSyncState("retailers", { status: "running", lastError: null });

    for await (const c of listCustomers(creds)) {
      await db
        .insert(retailersTable)
        .values({
          cin7CustomerId: c.ID,
          name: c.Name,
          category: c.Category ?? null,
          priceTier: c.PriceTier ?? null,
          status: (c.Status ?? "Active").toLowerCase(),
          creditLimit: c.CreditLimit != null ? String(c.CreditLimit) : null,
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: retailersTable.cin7CustomerId,
          set: {
            name: c.Name,
            category: c.Category ?? null,
            priceTier: c.PriceTier ?? null,
            status: (c.Status ?? "Active").toLowerCase(),
            creditLimit: c.CreditLimit != null ? String(c.CreditLimit) : null,
            syncedAt: new Date(),
          },
        });
      count += 1;
    }

    await markSyncState("retailers", { status: "idle", lastSyncedAt: new Date(), recordsSynced: count });
  } catch (err) {
    await markSyncState("retailers", { status: "error", lastError: String(err) });
    throw err;
  }
  return count;
}

// Syncs sale orders + lines updated since the last successful sync (or all time on first run).
export async function syncSaleOrders(creds: Cin7Credentials) {
  let count = 0;
  try {
    await markSyncState("sale_orders", { status: "running", lastError: null });

    const [state] = await db
      .select()
      .from(cin7SyncStateTable)
      .where(eq(cin7SyncStateTable.resource, "sale_orders"));
    const updatedSince = state?.lastSyncedAt?.toISOString();

    for await (const item of listSales(creds, updatedSince)) {
      const detail = await getSaleDetail(creds, item.SaleID);

      const [retailer] = await db
        .select()
        .from(retailersTable)
        .where(eq(retailersTable.cin7CustomerId, detail.CustomerID));
      if (!retailer) continue; // retailer not synced yet; will be picked up on next run

      const lines = detail.Order?.Lines ?? [];
      const subtotal = lines.reduce((sum, l) => sum + l.Price * l.Quantity, 0);
      const discountTotal = lines.reduce((sum, l) => sum + ((l.Price * l.Quantity * (l.Discount ?? 0)) / 100), 0);

      const [savedOrder] = await db
        .insert(saleOrdersTable)
        .values({
          cin7SaleId: detail.SaleID,
          retailerId: retailer.id,
          orderDate: detail.OrderDate.slice(0, 10),
          invoiceDate: detail.InvoiceDate ? detail.InvoiceDate.slice(0, 10) : null,
          status: detail.Status,
          currency: detail.Currency ?? "SAR",
          subtotal: String(subtotal),
          discountTotal: String(discountTotal),
          taxTotal: String(detail.Order?.TaxTotal ?? 0),
          total: String(detail.Order?.Total ?? subtotal - discountTotal),
          amountPaid: String(detail.Invoices?.reduce((s, i) => s + (i.AmountPaid ?? 0), 0) ?? 0),
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: saleOrdersTable.cin7SaleId,
          set: {
            status: detail.Status,
            invoiceDate: detail.InvoiceDate ? detail.InvoiceDate.slice(0, 10) : null,
            subtotal: String(subtotal),
            discountTotal: String(discountTotal),
            taxTotal: String(detail.Order?.TaxTotal ?? 0),
            total: String(detail.Order?.Total ?? subtotal - discountTotal),
            amountPaid: String(detail.Invoices?.reduce((s, i) => s + (i.AmountPaid ?? 0), 0) ?? 0),
            syncedAt: new Date(),
          },
        })
        .returning();

      await db.delete(saleOrderLinesTable).where(eq(saleOrderLinesTable.saleOrderId, savedOrder.id));

      for (const line of lines) {
        const sku = line.Product?.SKU ?? line.SKU;
        if (!sku) continue;
        const [product] = await db.select().from(productsTable).where(eq(productsTable.sku, sku));

        await db.insert(saleOrderLinesTable).values({
          saleOrderId: savedOrder.id,
          productId: product?.id ?? null,
          skuSnapshot: sku,
          quantity: String(line.Quantity),
          unitPrice: String(line.Price),
          discountPercent: String(line.Discount ?? 0),
          discountAmount: String((line.Price * line.Quantity * (line.Discount ?? 0)) / 100),
          lineTotal: String(line.Total),
          unitCostSnapshot: line.AverageCost != null ? String(line.AverageCost) : (product?.landedCost ?? null),
        });
      }

      count += 1;
    }

    await markSyncState("sale_orders", { status: "idle", lastSyncedAt: new Date(), recordsSynced: count });
  } catch (err) {
    await markSyncState("sale_orders", { status: "error", lastError: String(err) });
    throw err;
  }
  return count;
}

export async function syncAll() {
  const creds = getCin7CredentialsFromEnv();
  const products = await syncProducts(creds);
  const retailers = await syncRetailers(creds);
  const saleOrders = await syncSaleOrders(creds);
  return { products, retailers, saleOrders };
}

export async function getSyncStatus() {
  return db.select().from(cin7SyncStateTable);
}
