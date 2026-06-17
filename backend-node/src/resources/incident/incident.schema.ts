import Joi from "joi";

const CATEGORIES = ["phishing", "malware", "brute_force", "ddos", "vazamento_de_dados", "acesso_nao_autorizado", "engenharia_social", "outro"] as const;

export const incidentSchema = Joi.object({
    projectId: Joi.string().uuid().required(),
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(1).required(),
    category: Joi.string().valid(...CATEGORIES).required(),
    severity: Joi.string().valid("baixa", "media", "alta", "critica").default("baixa"),
    status: Joi.string().valid("aberto", "em_andamento", "fechado").default("aberto"),
    responsibleId: Joi.string().uuid().allow(null, "").optional(),
});

export const updateIncidentSchema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(1),
    category: Joi.string().valid(...CATEGORIES),
    severity: Joi.string().valid("baixa", "media", "alta", "critica"),
    status: Joi.string().valid("aberto", "em_andamento", "fechado"),
    responsibleId: Joi.string().uuid().allow(null, "").optional(),
}).min(1);
