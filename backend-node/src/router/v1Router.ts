import { Router } from "express";
import authRouter from "../resources/auth/auth.router";
import sessionRouter from "../resources/session/session.router";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/sessions", sessionRouter);

export default v1Router;