import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';

export const getStatistics = async (req, res) => {
  try {
    const registeredCount = await User.countDocuments();
    const activeCount = await User.countDocuments({ isOnline: true }); 
    const postsCount = await Listing.countDocuments();

    res.status(200).json({
      registered: registeredCount,
      active: activeCount,
      posts: postsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy số liệu thống kê' });
  }
};
