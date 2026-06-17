import Joi from "joi";

export const signupSchema = Joi.object({
  email: Joi.string().email().max(100).required(),
  fullname: Joi.string().max(100).required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/(?=.*[a-z])/, "letra minúscula")
    .pattern(/(?=.*[A-Z])/, "letra maiúscula")
    .pattern(/(?=.*\d)/, "número")
    .pattern(/(?=.*[@$!%*?&.])/i, "caractere especial") 
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});