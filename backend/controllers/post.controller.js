import Notification from "../models/notfication.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary"

const getAllPosts = async (req, res) => {
  const posts = await Post.find().sort({createdAt: -1}).populate({
    path: "user",
    select: "-password"
  }).populate({
    path: "comments.user",
    select: "-password"
  })

  return res.status(200).json(posts);
}
const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({error: "User not found"});
    }

    const followingList = user.following;
    
    const followingPosts = await Post.find({user: {$in: followingList}}).sort({createdAt: -1}).populate({
      path: "user",
      select: "-password"
    }).populate({
      path: "comments.user",
      select: "-password"
    });

    return res.status(200).json(followingPosts)

  } catch (error) {
    console.log(`Error in getFollowingPosts controller: ${error.message}`)
    return res.status(500).json({error: "Internal server error"})
  }
}
const getUserPosts = async (req, res) => {
  try {    
    const { username } = req.params;
    
    const user = await User.findOne({username});
    if(!user)
      return res.status(404).json({error: "User not found"})
  
    const posts = await Post.find({user: user._id}).sort({createdAt: -1}).populate({
      path: "user",
      select: "-password"
    }).populate({
      path: "comments.user",
      select: "-password"
    })

    return res.status(200).json(posts)
  } catch (error) {
    console.log(`Error in getUserPosts controller: ${error.message}`);
    return res.status(500).json({error: "Internal server error"})
  }

}
const getLikedPosts = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id);
    if(!user) 
      return res.status(404).json({error: "User not found"});

    const likedPosts = await Post.find({_id: {$in: user.likedPosts}}).populate({
      path: "user",
      select: "-password"
    }).populate({
      path: "comments.user",
      select: "-password"
    })

    return res.status(200).json(likedPosts)
  } catch (error) {
    console.log(`Error in getLikedPosts controller: ${error.message}`);
    return res.status(500).json({error: "Internal server error"})
  }
}
const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;

    if(!text && !img ) {
      return res.status(400).json({error: "A post should contain a text or img"});
    }

    const userId = req.user._id
    const user = await User.findById(userId);

    if(!user) 
      return res.status(404).json({error: "User not found"})
  

    if(img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: req.user._id,
      text,
      img
    })


    await newPost.save();
    return res.status(201).json(newPost)

  } catch (error) {
    console.log(`Error in createPost controller: ${error.message}`);
    res.status(400).json({error: "Internal Server error"});
  }
}
const likeUnlikePost = async (req, res) => {
  const { id:postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId)

  const isLiked = post.likes.some(uId => uId.equals(userId))

  if(isLiked) {
    await Post.findByIdAndUpdate(postId, {$pull: {likes: userId}})
    await User.updateOne({_id: userId}, { $pull: {likedPosts: postId}});

  } else {
    await Post.findByIdAndUpdate(postId, {$addToSet: {likes: userId}})
    await User.updateOne({_id: userId}, { $addToSet: {likedPosts: postId}});

    const newNotification = new Notification({
      from: userId,
      to: post.user,
      type: "like"
    })
    await newNotification.save();

  }
  const updatedPost = await Post.findById(postId).select("likes");
  return res.status(200).json(updatedPost.likes);

}
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;
    const userId  = req.user._id;

    if(!text) {
      return res.status(400).json({error: "Comment cannot be empty"});
    }

    const updatedPost = await Post.findByIdAndUpdate(id, {$push: {comments: {
      text,
      user: userId
    }}}, {new: true}).populate({
      path: "comments.user",
      select: "-password"
    });

    if(!updatedPost) {
      return res.status(404).json({error: "Post not found"});
    }

    console.log(updatedPost.comments)

    return res.status(200).json(updatedPost.comments)

  } catch (error) {
    console.log(`Error in commentOnPostController: ${error.message}`)
    return res.status(500).json({error: "Internal server error"})
  }
}
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
  
    const postToDel = await Post.findById(id);

    if(!postToDel)
      return res.status(404).json({error: "Post not found"});
    
    if(!postToDel.user.equals(userId)) {
      return res.status(401).json({error: "You cannot delete a post you don't own"})
    }

    if(postToDel.img) {
      const imgId = postToDel.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(id);
    return res.status(200).json({message: "Post deleted successfully"});

  } catch (error) {
    console.log(`Error in deletePost controller: ${error.message}`)
    return res.status(500).json({error: "Internal server error"})
  }
}


export default {
  getAllPosts,
  getUserPosts,
  getFollowingPosts,
  getLikedPosts,
  createPost,
  likeUnlikePost,
  commentOnPost,
  deletePost
}