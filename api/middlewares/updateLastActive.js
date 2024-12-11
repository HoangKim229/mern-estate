import User from '../models/user.model.js';

export const updateLastActive = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const userId = req.user.id;
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });
    }
    next();
  } catch (error) {
    console.error("Lỗi khi cập nhật hoạt động gần đây nhất:", error);
    next();
  }
};
