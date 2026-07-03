import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Cin7ApiError } from "../lib/cin7-client";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid request or response payload", details: err.issues });
    return;
  }

  if (err instanceof Cin7ApiError) {
    res.status(502).json({ error: `Cin7 API error: ${err.message}` });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
