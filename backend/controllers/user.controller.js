import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Notification from "../models/notfication.model.js";
import { v2 as cloudinary } from "cloudinary"

const getUserProfile = async (req, res) => {
  const { username } = req.params;
  
  try {
    const user = await User.findOne({username}).select("-password");
    if(!user) {
      return res.status(404).json({error: "User not found"});
    }
  
    return res.status(200).json(user);
  } catch (error) {
    console.log(`Error in get user profile controller: ${error.message}`);
    return res.status(500).json({error: "Internal server error"});
  }
}

const getSuggestedUsers = async (req, res) => {
  const userId = req.user._id
  try {    
    const userFollowing = await User.findById(userId);

    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: userId,
            $nin: userFollowing.following
          }
        }
      },
      {
        $sample: {size: 4}
      },
      {
        $project: {password: 0}
      }
    ])

    return res.status(200).json(suggestedUsers)

  } catch (error) {
    console.log(`Error in get suggested users controller: ${error.message}`);
    return res.status(500).json({error: "Internal server error"});
  }
}

const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findOne({_id: id});
    const currentUser = await User.findOne({_id: req.user._id});

    if(!targetUser || !currentUser) {
      return res.status(404).json({error: "user not found"});
    }

    // make following self impossible
    if(currentUser._id.equals(id)) {
      return res.status(400).json({error: "You cannot follow or unfollow yourself"});
    }

    const isFollowing = currentUser.following.some(f => f.equals(id));

    if(isFollowing) {
      await User.findByIdAndUpdate(id, {$pull: {followers: currentUser._id}});
      await User.findByIdAndUpdate(currentUser._id, {$pull: {following: id}});
    } else {
      await User.findByIdAndUpdate(id, {$addToSet: {followers: currentUser._id}});
      await User.findByIdAndUpdate(currentUser._id, {$addToSet: {following: id}});
  
      // send notification
      const newNotification = new Notification({
        type: "follow",
        from: currentUser._id,
        to: targetUser._id
      })
      console.log(newNotification)
      await newNotification.save();
    }

    const updatedCurrentUser = await User.findById(currentUser._id);
    const updatedTargetUser = await User.findById(targetUser._id);

    return res.status(200).json({
      currentUserFollowing: updatedCurrentUser.following.length,
      targetUserFollowers: updatedTargetUser.followers.length
    })

  } catch (error) {
    console.log(`Error in follow unfollow controller: ${error.message}`);
    return res.status(500).json({error: "Internal server error"});
  }
}

const updateUserProfile = async (req, res) => {
  try {
    const { username, fullName, email, currentPassword, newPassword, bio, link } = req.body;
    let {profileImg, coverImg} = req.body;
  
    const userId = req.user._id;
    const user = await User.findById(userId);
  
    if(!user) {
      return res.status(404).json({error: "User not found"})
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Provide both current and new password fields" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }  
  
    if(profileImg) {
      if(user.profileImg) {
        await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImg)
      profileImg = uploadedResponse.secure_url;
      user.profileImg = profileImg
    }
    
    if(coverImg) {
      if(user.coverImg) {
        await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
      }

      const uploadedResponse = await cloudinary.uploader.upload(coverImg)
      coverImg = uploadedResponse.secure_url;
      user.coverImg = coverImg;
    }
    
    user.fullName = fullName || user.fullName
    user.email = email || user.email
    user.username = username || user.username
    user.bio = bio || user.bio
    user.link = link || user.link

    await user.save();
    user.password = null;
    
    req.user = user
    return res.status(200).json(user)
  } catch (error) {
    console.log(`Error in updateProfile controller: ${error.message}`)
    res.status(500).json({error: "Internal server error"});
  }
}

export default {
  getUserProfile,
  getSuggestedUsers,
  followUnfollowUser,
  updateUserProfile
}