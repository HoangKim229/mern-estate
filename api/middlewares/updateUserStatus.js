import User from '../models/user.model.js'; // Import mô hình người dùng

export const updateUserStatus = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // Thời gian 15 phút trước

  try {
    // Cập nhật trạng thái isOnline cho những người dùng đã không hoạt động sau 15 phút
    await User.updateMany(
      { lastActive: { $lt: fifteenMinutesAgo } }, // Điều kiện tìm kiếm
      { isOnline: false } // Cập nhật trạng thái thành offline
    );
    console.log('User statuses updated successfully!');
  } catch (error) {
    console.error('Error updating user statuses:', error);
  }
};
