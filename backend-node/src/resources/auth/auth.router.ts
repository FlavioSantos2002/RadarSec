import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller";
import { validateBody } from "../../middlewares/validateBody";
import { signupSchema, loginSchema } from "./auth.schema";

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { msg: "Muitas tentativas. Tente novamente mais tarde." },
});

authRouter.use(authLimiter);

authRouter.post("/signup", validateBody(signupSchema), authController.signup);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/logout", authController.logout);

export default authRouter;