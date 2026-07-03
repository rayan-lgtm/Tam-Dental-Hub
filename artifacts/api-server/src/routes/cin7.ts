import { Router, type IRouter } from "express";
import { TriggerCin7SyncResponse, GetCin7SyncStatusResponse } from "@workspace/api-zod";
import { syncAll, getSyncStatus } from "../lib/cin7-sync";
import { asyncHandler } from "../lib/async-handler";

const router: IRouter = Router();

router.post(
  "/cin7/sync",
  asyncHandler(async (_req, res) => {
    const result = await syncAll();
    res.json(TriggerCin7SyncResponse.parse(result));
  }),
);

router.get(
  "/cin7/sync/status",
  asyncHandler(async (_req, res) => {
    const rows = await getSyncStatus();
    res.json(
      GetCin7SyncStatusResponse.parse(
        rows.map((r) => ({ ...r, lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null })),
      ),
    );
  }),
);

export default router;
