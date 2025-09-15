import express from "express"
const router = express.Router();
import notificationController from "../controllers/notification.controller.js"
import { protectRoute } from "../middleware/protectRoute.js"

router.get("/", protectRoute, notificationController.getNotifications)
router.delete("/", protectRoute, notificationController.deleteNotifications)
export default router;