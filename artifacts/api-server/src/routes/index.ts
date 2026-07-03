import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import retailersRouter from "./retailers";
import productsRouter from "./products";
import marketingSpendRouter from "./marketing-spend";
import cin7Router from "./cin7";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(retailersRouter);
router.use(productsRouter);
router.use(marketingSpendRouter);
router.use(cin7Router);

export default router;
