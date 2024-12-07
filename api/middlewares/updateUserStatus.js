import User from '../models/user.model.js';

export const updateUserStatus = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  try {
    await User.updateMany(
      { lastActive: { $lt: fifteenMinutesAgo } },
      { isOnline: false } 
    );
    console.log('Trạng thái người dùng đã được cập nhật thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
  }
};
