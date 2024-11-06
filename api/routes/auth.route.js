import express from 'express';
import { google, signOut, signin, signup } from '../controllers/auth.controller.js';
import { verifyToken } from "../utils/verifyUser.js";
import { setActiveStatusOnLogin, setInactiveStatusOnLogout } from '../middlewares/updateUserStatus.js'; // Import middleware

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin, setActiveStatusOnLogin);
router.post("/google", google, setActiveStatusOnLogin);
router.get("/signout", verifyToken, setInactiveStatusOnLogout, signOut);

export default router;