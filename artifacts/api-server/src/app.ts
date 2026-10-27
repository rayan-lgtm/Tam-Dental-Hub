import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "حدث خطأ غير متوقع، حاول مرة أخرى" });
};
app.use(errorHandler);

export default app;
