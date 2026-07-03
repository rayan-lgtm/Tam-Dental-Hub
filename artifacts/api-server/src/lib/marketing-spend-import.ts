import * as XLSX from "xlsx";
import { db } from "@workspace/db";
import { marketingSpendTable, retailersTable } from "@workspace/db/schema";

export interface MarketingSpendImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface ParsedRow {
  retailer?: string;
  channel?: string;
  period_start?: string;
  period_end?: string;
  amount?: string | number;
  notes?: string;
}

// Accepts a base64-encoded CSV or XLSX with columns:
// retailer, channel, period_start, period_end, amount, notes
// `retailer` blank/absent = unallocated brand-level spend.
export async function importMarketingSpendFromBase64(
  contentBase64: string,
): Promise<MarketingSpendImportResult> {
  const buffer = Buffer.from(contentBase64, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return { imported: 0, skipped: 0, errors: ["File has no sheets/rows"] };
  }

  const rows = XLSX.utils.sheet_to_json<ParsedRow>(workbook.Sheets[firstSheet]!, { defval: "" });

  const retailers = await db.select().from(retailersTable);
  const retailerByName = new Map(retailers.map((r) => [r.name.trim().toLowerCase(), r]));

  const result: MarketingSpendImportResult = { imported: 0, skipped: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2; // header is row 1
    const channel = String(row.channel ?? "").trim();
    const periodStart = String(row.period_start ?? "").trim();
    const periodEnd = String(row.period_end ?? "").trim();
    const amount = Number(row.amount);

    if (!channel || !periodStart || !periodEnd || !Number.isFinite(amount)) {
      result.errors.push(`Row ${rowNum}: missing/invalid channel, period_start, period_end, or amount`);
      result.skipped += 1;
      continue;
    }

    let retailerId: number | null = null;
    const retailerName = String(row.retailer ?? "").trim();
    if (retailerName) {
      const match = retailerByName.get(retailerName.toLowerCase());
      if (!match) {
        result.errors.push(`Row ${rowNum}: no retailer found matching "${retailerName}"`);
        result.skipped += 1;
        continue;
      }
      retailerId = match.id;
    }

    await db.insert(marketingSpendTable).values({
      retailerId,
      channel,
      periodStart,
      periodEnd,
      amount: String(amount),
      source: "csv_import",
      notes: row.notes ? String(row.notes) : null,
    });
    result.imported += 1;
  }

  return result;
}
