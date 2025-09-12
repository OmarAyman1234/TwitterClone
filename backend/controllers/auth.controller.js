import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

const signup = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;
    
    if(!fullName || !username || !email || !password) {
      return res.status(400).json({error: "Please fill up all fields."});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
      return res.status(400).json({error: "Invalid email format"});
    }
    
    const usernameExists = await User.findOne({username});
    if(usernameExists) {
      return res.status(409).json({error: "Username is already taken"})
    }

    const emailExists = await User.findOne({username});
    if(emailExists) {
      return res.status(409).json({error: "Email is already taken"})
    }
    
    if(password.length < 6) {
      return res.status(400).json({error: "Password must be at least 6 characters"});
    }
    
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword
    })

    console.log(JSON.stringify(newUser));

    if(newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      })
    } else {
      res.status(400).json({error: "Invalid user data"});
    }
  } catch (error) {
    console.log(`Error in signup controller: ${error}`);
    res.status(500).json({error: "Internal Server Error"});
  }
}

const login = async (req, res) => {
  try {
    const { username, password} = req.body;
    const user = await User.findOne({username});

    if(!user) {
      return res.status(400).json({error: "Invalid username or password"});
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect) {
      return res.status(400).json({error: "Invalid username or password"});
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    })
  } catch (error) {
    console.log(`Error in login controller: ${error}`);
    res.status(500).json({error: "Internal Server Error"});
  }
}

const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {maxAge: 0});
    res.status(200).json({message: "Logged out successfully"});
  } catch (error) {
    console.log(`Error in logout controller: ${error}`);
    res.status(500).json({error: "Internal Server Error"});
  }
}

export const getMe = async (req, res) => {
  try {
    
  } catch (error) {
    
  }
}

export default {
  signup,
  login,
  logout
}