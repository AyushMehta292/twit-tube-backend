import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { connectDB } from "../db/index.js";

const healthcheck = asyncHandler(async (req, res) => {
  await connectDB();
  await mongoose.connection.db.admin().command({ ping: 1 });
  return res
    .status(200)
    .json(new APIResponse(200, { status: "OK", db: "connected" }, "Health is good"));
});

export { healthcheck };
