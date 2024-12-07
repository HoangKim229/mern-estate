import express from "express";
import { createListing, deleteListing, updateListing, getListing, getListings } from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";
import { updateLastActive } from '../middlewares/updateLastActive.js';

const router = express.Router();

router.post("/create", verifyToken, updateLastActive, createListing);
router.delete('/delete/:id', verifyToken, updateLastActive, deleteListing);
router.post('/update/:id', verifyToken, updateLastActive, updateListing);
router.get('/get/:id', getListing);
router.get('/get', updateLastActive, getListings);

export default router;
