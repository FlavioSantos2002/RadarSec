import { Router } from "express";
import * as incidentController from "./incident.controller";
import { isAuth } from "../../middlewares/isAuth";
import { isAdmin } from "../../middlewares/isAdmin";
import { validateBody } from "../../middlewares/validateBody";
import { incidentSchema } from "./incident.schema";

const incidentRouter = Router();

incidentRouter.use(isAuth);

incidentRouter.get("/admin/all", isAdmin, incidentController.getAllIncidentsAdmin);
incidentRouter.get("/", incidentController.getAllIncidents);
incidentRouter.post("/", validateBody(incidentSchema), incidentController.createIncident);
incidentRouter.get("/:id", incidentController.getIncidentById);
incidentRouter.put("/:id", validateBody(incidentSchema), incidentController.updateIncident);
incidentRouter.delete("/:id", incidentController.deleteIncident);

export default incidentRouter;
