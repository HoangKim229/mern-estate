// controllers/statistics.controller.js
import User from '../models/user.model.js'; // Import mô hình người dùng
import Listing from '../models/listing.model.js'; // Import mô hình danh sách

export const getStatistics = async (req, res) => {
  try {
    const registeredCount = await User.countDocuments(); // Số lượng người đã đăng ký
    const activeCount = await User.countDocuments({ isOnline: true }); // Số lượng người đang hoạt động
    const postsCount = await Listing.countDocuments(); // Số lượng bài đăng

    res.status(200).json({
      registered: registeredCount,
      active: activeCount,
      posts: postsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};
