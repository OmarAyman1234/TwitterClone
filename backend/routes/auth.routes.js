import express from "express";
import authController from "../controllers/auth.controller.js"
import { protectRoute } from "../middleware/protectRoute.js";
const router = express.Router();

router.get("/me", protectRoute, authController.getMe)
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

export default router;