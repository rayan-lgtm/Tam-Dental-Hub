import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { errorHandler } from "./middlewares/error-handler";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(errorHandler);

export default app;
