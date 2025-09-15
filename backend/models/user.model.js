import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true, 
      unique: true
    },
    fullName: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      minLength: 6
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //references User model
        default: [] // user has 0 followers by default
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //references User model
        default: [] // user has 0 followers by default
      }
    ],
    profileImg: {
      type: String,
      default: ""
    },
    coverImg: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    link: {
      type: String,
      default: ""
    },
    likedPosts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Post",
        default: []
      }
    ]
  }, 
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;