// Seeds realistic sample data (retailers, products, sale orders, marketing spend)
// for local development / demos of the retail-dashboard artifact, since it isn't
// wired to a live Cin7 account yet. Safe to re-run: truncates and reseeds.
import { db, pool } from "@workspace/db";
import {
  retailersTable,
  productsTable,
  saleOrdersTable,
  saleOrderLinesTable,
  marketingSpendTable,
  cin7SyncStateTable,
} from "@workspace/db/schema";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const RETAILERS = [
  { name: "Urban Mart Group", category: "National Chain", priceTier: "Tier 1" },
  { name: "GreenLeaf Retail Co.", category: "Regional Chain", priceTier: "Tier 1" },
  { name: "Coastal Wholesale", category: "Distributor", priceTier: "Tier 2" },
  { name: "Peak Supply Partners", category: "Distributor", priceTier: "Tier 2" },
  { name: "Sunrise Convenience", category: "Independent", priceTier: "Tier 3" },
  { name: "Metro Beauty Stores", category: "Regional Chain", priceTier: "Tier 1" },
  { name: "Blue Harbor Retail", category: "Independent", priceTier: "Tier 3" },
  { name: "Golden Gate Mercantile", category: "National Chain", priceTier: "Tier 1" },
  { name: "Silver Oak Stores", category: "Regional Chain", priceTier: "Tier 2" },
  { name: "Riverside Trading Co.", category: "Independent", priceTier: "Tier 3" },
];

const CATEGORIES = ["Skincare", "Haircare", "Supplements", "Oral Care", "Personal Care"];
const BRANDS = ["Lumen", "Verdant", "PureForm", "Northline"];

const PRODUCTS = Array.from({ length: 24 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length]!;
  const cost = randomBetween(8, 45);
  return {
    sku: `SKU-${1000 + i}`,
    name: `${category} ${["Essential", "Advanced", "Daily", "Pro"][i % 4]} ${100 + i}`,
    category,
    brand: pick(BRANDS),
    landedCost: cost,
    listPrice: cost * randomBetween(2.2, 3.4),
  };
});

const CHANNELS = ["Meta Ads", "Google Ads", "TikTok Ads", "Influencer", "Retail Media"];

async function seed() {
  console.log("Clearing existing retail-dashboard data...");
  await db.delete(saleOrderLinesTable);
  await db.delete(saleOrdersTable);
  await db.delete(marketingSpendTable);
  await db.delete(productsTable);
  await db.delete(retailersTable);
  await db.delete(cin7SyncStateTable);

  console.log("Seeding retailers...");
  const retailers = [];
  for (const [i, r] of RETAILERS.entries()) {
    const [row] = await db
      .insert(retailersTable)
      .values({
        cin7CustomerId: `seed-cust-${i + 1}`,
        name: r.name,
        category: r.category,
        priceTier: r.priceTier,
        status: "active",
        paymentTermDays: pick([15, 30, 45, 60]),
        creditLimit: String(Math.round(randomBetween(20000, 200000))),
        syncedAt: new Date(),
      })
      .returning();
    retailers.push(row);
  }

  console.log("Seeding products...");
  const products = [];
  for (const [i, p] of PRODUCTS.entries()) {
    const [row] = await db
      .insert(productsTable)
      .values({
        cin7ProductId: `seed-prod-${i + 1}`,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand,
        landedCost: p.landedCost.toFixed(4),
        listPrice: p.listPrice.toFixed(4),
        isActive: true,
        syncedAt: new Date(),
      })
      .returning();
    products.push(row);
  }

  console.log("Seeding sale orders + lines (last 12 months)...");
  let saleCounter = 1;
  for (const retailer of retailers) {
    const orderCount = Math.floor(randomBetween(8, 22));
    // Distributors/national chains discount harder; independents less so.
    const baseDiscount = retailer.priceTier === "Tier 1" ? 12 : retailer.priceTier === "Tier 2" ? 7 : 3;

    for (let o = 0; o < orderCount; o++) {
      const orderDate = daysAgo(Math.floor(randomBetween(0, 365)));
      const lineCount = Math.floor(randomBetween(2, 6));
      const lines: { product: (typeof products)[number]; quantity: number; discountPercent: number }[] = [];
      for (let l = 0; l < lineCount; l++) {
        lines.push({
          product: pick(products),
          quantity: Math.floor(randomBetween(10, 120)),
          discountPercent: Math.max(0, baseDiscount + randomBetween(-4, 6)),
        });
      }

      const subtotal = lines.reduce((s, l) => s + Number(l.product.listPrice) * l.quantity, 0);
      const discountTotal = lines.reduce(
        (s, l) => s + Number(l.product.listPrice) * l.quantity * (l.discountPercent / 100),
        0,
      );
      const taxTotal = (subtotal - discountTotal) * 0.15;
      const total = subtotal - discountTotal + taxTotal;
      const isPaid = Math.random() > 0.2;

      const [order] = await db
        .insert(saleOrdersTable)
        .values({
          cin7SaleId: `seed-sale-${saleCounter++}`,
          retailerId: retailer.id,
          orderDate,
          invoiceDate: orderDate,
          status: "AUTHORISED",
          currency: "SAR",
          subtotal: subtotal.toFixed(2),
          discountTotal: discountTotal.toFixed(2),
          taxTotal: taxTotal.toFixed(2),
          total: total.toFixed(2),
          amountPaid: isPaid ? total.toFixed(2) : (total * randomBetween(0, 0.5)).toFixed(2),
          syncedAt: new Date(),
        })
        .returning();

      for (const line of lines) {
        const unitPrice = Number(line.product.listPrice);
        const lineDiscountAmount = unitPrice * line.quantity * (line.discountPercent / 100);
        const lineTotal = unitPrice * line.quantity - lineDiscountAmount;
        await db.insert(saleOrderLinesTable).values({
          saleOrderId: order.id,
          productId: line.product.id,
          skuSnapshot: line.product.sku,
          quantity: String(line.quantity),
          unitPrice: unitPrice.toFixed(4),
          discountPercent: line.discountPercent.toFixed(3),
          discountAmount: lineDiscountAmount.toFixed(2),
          lineTotal: lineTotal.toFixed(2),
          unitCostSnapshot: line.product.landedCost,
        });
      }
    }
  }

  console.log("Seeding marketing spend (last 12 months)...");
  for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
    const periodStart = daysAgo(monthsAgo * 30 + 29);
    const periodEnd = daysAgo(monthsAgo * 30);

    // Unallocated brand-level spend (e.g. top-of-funnel awareness campaigns).
    await db.insert(marketingSpendTable).values({
      retailerId: null,
      channel: "Brand Awareness",
      periodStart,
      periodEnd,
      amount: Math.round(randomBetween(3000, 8000)).toString(),
      source: "seed",
      notes: "Unallocated brand-level spend",
    });

    // Retailer-attributed co-op / performance spend for the larger accounts.
    for (const retailer of retailers.filter((r) => r.priceTier !== "Tier 3")) {
      await db.insert(marketingSpendTable).values({
        retailerId: retailer.id,
        channel: pick(CHANNELS),
        periodStart,
        periodEnd,
        amount: Math.round(randomBetween(500, 4000)).toString(),
        source: "seed",
        notes: null,
      });
    }
  }

  console.log("Seeding cin7 sync state...");
  for (const resource of ["products", "retailers", "sale_orders"]) {
    await db
      .insert(cin7SyncStateTable)
      .values({
        resource,
        lastSyncedAt: new Date(),
        lastCursor: null,
        recordsSynced: resource === "products" ? products.length : resource === "retailers" ? retailers.length : saleCounter - 1,
        status: "idle",
        lastError: null,
      })
      .onConflictDoUpdate({
        target: cin7SyncStateTable.resource,
        set: { lastSyncedAt: new Date(), status: "idle" },
      });
  }

  console.log(`Done. Seeded ${retailers.length} retailers, ${products.length} products, ${saleCounter - 1} sale orders.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
