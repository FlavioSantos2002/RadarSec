import { Router } from "express";
import * as evidenceController from "./evidence.controller";
import { isAuth } from "../../middlewares/isAuth";

const evidenceRouter = Router();

evidenceRouter.use(isAuth);

// Download a specific evidence file (protected)
evidenceRouter.get("/:id/file", evidenceController.downloadEvidence);

// Delete an evidence record + file
evidenceRouter.delete("/:id", evidenceController.deleteEvidence);

export default evidenceRouter;
