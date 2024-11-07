import User from '../models/user.model.js';

export const updateLastActive = async (req, res, next) => {
  try {
    // Kiểm tra nếu `req.user` đã được khởi tạo và có thuộc tính `id`
    if (req.user && req.user.id) {
      const userId = req.user.id;
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });
    }
    next(); // Tiếp tục đến middleware hoặc route tiếp theo
  } catch (error) {
    console.error("Error updating last active:", error); // Thêm log để kiểm tra lỗi
    next(); // Đảm bảo middleware không ngăn chặn luồng xử lý
  }
};
