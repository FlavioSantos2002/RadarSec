import { Router } from "express";
import * as projectController from "./project.controller";
import { isAuth } from "../../middlewares/isAuth";
import { validateBody } from "../../middlewares/validateBody";
import { createProjectSchema, updateProjectSchema } from "./project.schema";

const projectRouter = Router();

projectRouter.use(isAuth);

projectRouter.get("/", projectController.getAllProjects);
projectRouter.post("/", validateBody(createProjectSchema), projectController.createProject);
projectRouter.get("/:id", projectController.getProjectById);
projectRouter.put("/:id", validateBody(updateProjectSchema), projectController.updateProject);
projectRouter.delete("/:id", projectController.deleteProject);

export default projectRouter;
