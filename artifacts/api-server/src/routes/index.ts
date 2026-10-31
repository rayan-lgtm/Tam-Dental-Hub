import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cupRouter from "../cup/routes";
import qaRouter from "../qa/routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/cup", cupRouter);
router.use("/qa", qaRouter);

export default router;
