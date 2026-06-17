import { Router } from "express";
import * as incidentController from "./incident.controller";
import * as evidenceController from "../evidence/evidence.controller";
import { isAuth } from "../../middlewares/isAuth";
import { isAdmin } from "../../middlewares/isAdmin";
import { validateBody } from "../../middlewares/validateBody";
import { incidentSchema, updateIncidentSchema } from "./incident.schema";
import { upload } from "../../config/upload";

const incidentRouter = Router();

incidentRouter.use(isAuth);

incidentRouter.get("/admin/all", isAdmin, incidentController.getAllIncidentsAdmin);

// GET /incidents?projectId=xxx  |  POST /incidents
incidentRouter.get("/", incidentController.getIncidents);
incidentRouter.post("/", validateBody(incidentSchema), incidentController.createIncident);

// Single incident CRUD
incidentRouter.get("/:id", incidentController.getIncidentById);
incidentRouter.put("/:id", validateBody(updateIncidentSchema), incidentController.updateIncident);
incidentRouter.delete("/:id", incidentController.deleteIncident);

// Evidence nested under incident
incidentRouter.get("/:id/evidence", evidenceController.getEvidences);
incidentRouter.post("/:id/evidence", upload.single("file"), evidenceController.uploadEvidence);

export default incidentRouter;
