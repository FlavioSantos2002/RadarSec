import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller";
import { validateBody } from "../../middlewares/validateBody";
import { signupSchema, loginSchema } from "./auth.schema";
import { isAuth } from "../../middlewares/isAuth";

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { msg: "Muitas tentativas. Tente novamente mais tarde." },
});

authRouter.post("/signup", authLimiter, validateBody(signupSchema), authController.signup);
authRouter.post("/login", authLimiter, validateBody(loginSchema), authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/users", isAuth, authController.listUsers);

export default authRouter;
