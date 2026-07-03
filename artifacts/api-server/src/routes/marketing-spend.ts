import { Router, type IRouter } from "express";
import {
  ListMarketingSpendQueryParams,
  ListMarketingSpendResponse,
  ListMarketingSpendResponseItem,
  CreateMarketingSpendBody,
  DeleteMarketingSpendParams,
  ImportMarketingSpendBody,
  ImportMarketingSpendResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { marketingSpendTable, retailersTable } from "@workspace/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { asyncHandler } from "../lib/async-handler";
import { importMarketingSpendFromBase64 } from "../lib/marketing-spend-import";

const router: IRouter = Router();

router.get(
  "/marketing-spend",
  asyncHandler(async (req, res) => {
    const { from, to } = ListMarketingSpendQueryParams.parse(req.query);
    const rows = await db
      .select({
        id: marketingSpendTable.id,
        retailerId: marketingSpendTable.retailerId,
        retailerName: retailersTable.name,
        channel: marketingSpendTable.channel,
        periodStart: marketingSpendTable.periodStart,
        periodEnd: marketingSpendTable.periodEnd,
        amount: marketingSpendTable.amount,
        source: marketingSpendTable.source,
        notes: marketingSpendTable.notes,
      })
      .from(marketingSpendTable)
      .leftJoin(retailersTable, eq(marketingSpendTable.retailerId, retailersTable.id))
      .where(and(lte(marketingSpendTable.periodStart, to), gte(marketingSpendTable.periodEnd, from)));

    res.json(ListMarketingSpendResponse.parse(rows.map((r) => ({ ...r, amount: Number(r.amount) }))));
  }),
);

router.post(
  "/marketing-spend",
  asyncHandler(async (req, res) => {
    const input = CreateMarketingSpendBody.parse(req.body);
    const [row] = await db
      .insert(marketingSpendTable)
      .values({
        retailerId: input.retailerId ?? null,
        channel: input.channel,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        amount: String(input.amount),
        source: "manual",
        notes: input.notes ?? null,
      })
      .returning();

    const retailerName = row.retailerId
      ? (await db.select().from(retailersTable).where(eq(retailersTable.id, row.retailerId)))[0]?.name ?? null
      : null;

    res.status(201).json(
      ListMarketingSpendResponseItem.parse({ ...row, retailerName, amount: Number(row.amount) }),
    );
  }),
);

router.delete(
  "/marketing-spend/:id",
  asyncHandler(async (req, res) => {
    const { id } = DeleteMarketingSpendParams.parse(req.params);
    await db.delete(marketingSpendTable).where(eq(marketingSpendTable.id, id));
    res.status(204).send();
  }),
);

router.post(
  "/marketing-spend/import",
  asyncHandler(async (req, res) => {
    const { contentBase64 } = ImportMarketingSpendBody.parse(req.body);
    const result = await importMarketingSpendFromBase64(contentBase64);
    res.json(ImportMarketingSpendResponse.parse(result));
  }),
);

export default router;
