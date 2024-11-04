import express from 'express';
import { deleteUser, test, updateUser,  getUserListings, getUser} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { updateLastActive } from '../middlewares/updateLastActive.js'; // **Import middleware để cập nhật lastActive**


const router = express.Router();

router.get('/test', test);
router.post('/update/:id', verifyToken, updateLastActive, updateUser)
router.delete('/delete/:id', verifyToken, updateLastActive, deleteUser)
router.get('/listings/:id', verifyToken, updateLastActive, getUserListings)
router.get('/:id', verifyToken, updateLastActive, getUser)

export default router;