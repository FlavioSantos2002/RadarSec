import Joi from "joi";

export const createSessionSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(1).required(),
});

export const addSceneSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(1).required(),
  choices: Joi.array().items(Joi.string().min(1).max(200)).min(2).max(6).required(),
});

export const voteSchema = Joi.object({
  sceneId: Joi.string().uuid().required(),
  choiceId: Joi.string().uuid().required(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid("waiting", "active", "finished").required(),
});
