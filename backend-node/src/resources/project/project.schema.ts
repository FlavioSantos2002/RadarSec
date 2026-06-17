import Joi from "joi";

export const createProjectSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(1).required(),
});

export const updateProjectSchema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(1),
}).min(1);
