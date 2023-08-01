import express from "express";
import { checkAuthorized } from "@/middlewares/auth";
import * as controllers from "./controllers"

const router = express.Router();

router.use(checkAuthorized)

router.get("/", controllers.getNotifications)
router.post("/mark-read", controllers.markNotificationsAsRead)
export default router;
