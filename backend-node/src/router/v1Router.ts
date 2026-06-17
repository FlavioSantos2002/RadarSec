import { Router } from "express";
import authRouter from "../resources/auth/auth.router";
import incidentRouter from "../resources/incident/incident.router";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/incidents", incidentRouter);

export default v1Router;