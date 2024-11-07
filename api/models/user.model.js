import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['buyer', 'seller'],
      default: 'buyer',
    },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    },
    isOnline: { 
      type: Boolean, 
      default: false, 
    },
    lastActive: {
       type: Date, 
       default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
