import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cupRouter from "../cup/routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/cup", cupRouter);

export default router;
