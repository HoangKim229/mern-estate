import User from '../models/user.model.js';

// Middleware cập nhật trạng thái online khi đăng nhập
export const setActiveStatusOnLogin = async (req, res, next) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ thông tin xác thực
    await User.findByIdAndUpdate(userId, { isOnline: true });  // Cập nhật trạng thái online
    next();  // Tiếp tục đến route tiếp theo
  } catch (error) {
    console.error(error);
    next(error);  // Chuyển tiếp lỗi
  }
};

export const setInactiveStatusOnLogout = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      console.log(`Logging out user with ID: ${req.user.id}`);  // Kiểm tra xem req.user có tồn tại không
      const userId = req.user.id;
      await User.findByIdAndUpdate(userId, { isOnline: false });
      console.log(`User ${userId} set to offline.`);  // Kiểm tra trạng thái offline
    } catch (error) {
      console.error("Error setting user status to offline:", error);
    }
  } else {
    console.log("User not found or not authenticated.");  // Log khi req.user không tồn tại
  }
  next();
};