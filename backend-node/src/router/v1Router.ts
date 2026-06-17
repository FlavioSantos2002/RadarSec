import { Router } from "express";
import authRouter from "../resources/auth/auth.router";
import incidentRouter from "../resources/incident/incident.router";
import projectRouter from "../resources/project/project.router";
import evidenceRouter from "../resources/evidence/evidence.router";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/projects", projectRouter);
v1Router.use("/incidents", incidentRouter);
v1Router.use("/evidence", evidenceRouter);

export default v1Router;
