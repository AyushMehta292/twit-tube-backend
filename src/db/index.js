import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/** Reuse connection across Vercel serverless invocations (warm instances). */
let cached = globalThis.__mongooseTwitTubeCache;

if (!cached) {
  cached = globalThis.__mongooseTwitTubeCache = { promise: null };
}

export async function connectDB() {
  const baseUrl = process.env.MONGODB_URL;
  if (!baseUrl) {
    throw new Error("MONGODB_URL is not defined");
  }

  const uri = `${baseUrl.replace(/\/$/, "")}/${DB_NAME}`;

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    });
  }

  try {
    await cached.promise;
    return mongoose;
  } catch (err) {
    cached.promise = null;
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

/** Local dev entry — connect once before app.listen */
export default connectDB;
