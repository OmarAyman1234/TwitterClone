import express from "express"
import userController from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, userController.getUserProfile);
router.get("/suggested", protectRoute, userController.getSuggestedUsers);
router.post("/follow/:id", protectRoute, userController.followUnfollowUser);
router.post("/update", protectRoute, userController.updateUserProfile);

export default router;