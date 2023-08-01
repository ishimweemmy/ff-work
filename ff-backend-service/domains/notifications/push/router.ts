import { checkAuthorized } from "@/middlewares/auth";
import express from "express";
import {
  createNotificationSubscription,
  getPublicSubscriptionKey,
} from "./notificationSubscriptions";
import bellRoutes from "../bell/routes"

const router = express.Router();

router.use(checkAuthorized);

router.get("/pushKey", getPublicSubscriptionKey);
router.post("/subscribe", createNotificationSubscription);

router.use("/bell", bellRoutes)

export default router;
