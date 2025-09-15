import User from "../models/user.model.js"
import Notification from "../models/notfication.model.js"

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if(!user) 
      return res.status(404).json({error: "User not found"});
    
    const notifications = await Notification.find({to: userId}).populate({
      path: "from",
      select: "username profileImg"
    })
    
    await Notification.updateMany({to: userId}, {read: true});
    return res.status(200).json(notifications);
  } catch (error) {
    console.log(`Error in getNotificationsController: ${error.message}`)
    res.status(500).json({error: "Internal server error"})
  }
}

const deleteNotifications = async (req, res) => {
  try {    
    const userId = req.user._id
  
    const user = await User.findById(userId);
    if(!user) 
      return res.status(404).json({error: "User not found"});
    
    await Notification.deleteMany({to: userId});
    res.status(200).json({message: "Notifications deleted successfully"})

  } catch (error) {
    console.log(`Error in getNotificationsController: ${error.message}`)
    res.status(500).json({error: "Internal server error"})
  }
}

export default {
  getNotifications,
  deleteNotifications
}