import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { connectDB } from "./db/index.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetCommentRouter from "./routes/tweetComment.routes.js";
import aboutRouter from "./routes/about.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CORS_ORIGIN_PROD,
  process.env.CORS_ORIGIN_LOCAL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, origin || allowedOrigins[0]);
      }
      return cb(null, allowedOrigins[0]);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use(cookieParser());
app.use(morgan("dev"));

/** Vercel/serverless: ensure Mongo is connected before route handlers. */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("[MongoDB]", err.message);
    res.status(503).json({
      message: "Database unavailable",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

app.get("/", (req, res) => res.send("Backend of Twit-Tube by Ayush Mehta"));

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("[health]", err.message);
    res.status(503).json({
      status: "error",
      db: "disconnected",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
});

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/tweet-comments", tweetCommentRouter);
app.use("/api/v1/about/user/", aboutRouter);

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large" });
  }
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

export { app };
export default app;
