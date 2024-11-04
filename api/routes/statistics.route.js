import express from 'express';
import { getStatistics } from '../controllers/statistics.controller.js';

const router = express.Router();

// Route để lấy thông tin thống kê
router.get('/', getStatistics); // Bạn có thể để đường dẫn này là /api/statistics nếu cần thiết

export default router;
