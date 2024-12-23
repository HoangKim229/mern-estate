import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";
import statisticsRouter from "./routes/statistics.route.js";
import cookieParser from "cookie-parser";
import path from "path";
import { updateUserStatus } from './middlewares/updateUserStatus.js';
dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Đã kết nối với MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

  const __dirname = path.resolve();

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use("/api/statistics", statisticsRouter);

setInterval(updateUserStatus, 15 * 60 * 1000);


app.listen(3000, () => {
  console.log("Máy chủ đang chạy trên cổng 3000!");
});

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);


app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
})

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ nội bộ";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
