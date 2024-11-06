import User from "../models/user.model.js";

export const setActiveStatusOnLogin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { isOnline: true });
    next();
  } catch (error) {
    next(error);
  }
};

export const setInactiveStatusOnLogout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { isOnline: false });
    next();
  } catch (error) {
    next(error);
  }
};
