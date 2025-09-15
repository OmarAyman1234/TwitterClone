import express from "express"
import { protectRoute } from "../middleware/protectRoute.js";
import postController from "../controllers/post.controller.js"
const router = express.Router();

router.get("/all", protectRoute, postController.getAllPosts)
router.get("/following", protectRoute, postController.getFollowingPosts)
router.get("/user/:username", protectRoute, postController.getUserPosts)
router.get("/likes/:id", protectRoute, postController.getLikedPosts)
router.post("/create", protectRoute, postController.createPost);
router.post("/like/:id", protectRoute, postController.likeUnlikePost)
router.post("/comment/:id", protectRoute, postController.commentOnPost)
router.delete("/:id", protectRoute, postController.deletePost);

export default router;