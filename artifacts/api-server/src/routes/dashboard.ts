import { Router, type IRouter } from "express";
import { GetDashboardSummaryQueryParams, GetDashboardSummaryResponse } from "@workspace/api-zod";
import { getDashboardSummary } from "../lib/retailer-kpis";
import { asyncHandler } from "../lib/async-handler";

const router: IRouter = Router();

router.get(
  "/dashboard/summary",
  asyncHandler(async (req, res) => {
    const { from, to } = GetDashboardSummaryQueryParams.parse(req.query);
    const summary = await getDashboardSummary(from, to);
    res.json(GetDashboardSummaryResponse.parse(summary));
  }),
);

export default router;
