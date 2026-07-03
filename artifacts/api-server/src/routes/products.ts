import { Router, type IRouter } from "express";
import { GetProductMarginsQueryParams, GetProductMarginsResponse } from "@workspace/api-zod";
import { getProductMargins } from "../lib/margins";
import { asyncHandler } from "../lib/async-handler";

const router: IRouter = Router();

router.get(
  "/products/margins",
  asyncHandler(async (req, res) => {
    const { from, to } = GetProductMarginsQueryParams.parse(req.query);
    const margins = await getProductMargins(from, to);
    res.json(GetProductMarginsResponse.parse(margins));
  }),
);

export default router;
