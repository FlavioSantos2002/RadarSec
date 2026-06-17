import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as authService from "./auth.service";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json(user);
  } catch (error: any) {

    console.error("=== ERRO NO SIGNUP ===", error); 
    
    if (error.message === "EMAIL_EXISTS") {
      res.status(400).json({ msg: "E-mail já cadastrado" });
    } else {
      
      res.status(500).json({ msg: "Erro interno no servidor", detalhe: error.message });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.login(req.body);
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );
    res.status(200).json({
      token,
      user: { id: user.id, fullname: user.fullname, role: user.role },
    });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ msg: "Credenciais inválidas" });
    } else {
      res.status(500).json({ msg: "Erro interno no servidor" });
    }
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({ msg: "Logout realizado com sucesso" });
};