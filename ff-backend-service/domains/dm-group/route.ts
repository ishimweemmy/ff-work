import { checkAuthorized } from "@/middlewares/auth";
import express from "express";
import * as controllers from "./controllers";

const router = express.Router();

router.use(checkAuthorized);
router.get("/", (_req, res) => {
  return res.send("Hello world");
});

router.post("/create", controllers.createDmGroup);

router.post("/accept", controllers.acceptDmGroupInvite);

export default router;
