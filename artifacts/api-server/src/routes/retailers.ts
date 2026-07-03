import { Router, type IRouter } from "express";
import { GetRetailerKpisQueryParams, GetRetailerKpisResponse } from "@workspace/api-zod";
import { getRetailerKpis } from "../lib/retailer-kpis";
import { asyncHandler } from "../lib/async-handler";

const router: IRouter = Router();

router.get(
  "/retailers/kpis",
  asyncHandler(async (req, res) => {
    const { from, to } = GetRetailerKpisQueryParams.parse(req.query);
    const kpis = await getRetailerKpis(from, to);
    res.json(GetRetailerKpisResponse.parse(kpis));
  }),
);

export default router;
