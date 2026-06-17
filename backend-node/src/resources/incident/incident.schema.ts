import Joi from "joi";

export const incidentSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(1).required(),
});
