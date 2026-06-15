import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { APIError } from "./APIError.js";

const MAX_TAGGED_USERS = 5;
const MAX_TAGGED_VIDEOS = 5;

function dedupeObjectIds(ids) {
  return [...new Set(ids.map((id) => id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
}

export async function validateTweetTags({ ownerId, taggedUsers = [], taggedVideos = [] }) {
  if (!Array.isArray(taggedUsers) || !Array.isArray(taggedVideos)) {
    throw new APIError(400, "taggedUsers and taggedVideos must be arrays");
  }

  if (taggedUsers.length < 1) {
    throw new APIError(400, "At least one user must be tagged");
  }
  if (taggedVideos.length < 1) {
    throw new APIError(400, "At least one video must be tagged");
  }
  if (taggedUsers.length > MAX_TAGGED_USERS) {
    throw new APIError(400, `Maximum ${MAX_TAGGED_USERS} users can be tagged`);
  }
  if (taggedVideos.length > MAX_TAGGED_VIDEOS) {
    throw new APIError(400, `Maximum ${MAX_TAGGED_VIDEOS} videos can be tagged`);
  }

  const userIds = dedupeObjectIds(taggedUsers);
  const videoIds = dedupeObjectIds(taggedVideos);

  if (!userIds.every((id) => isValidObjectId(id))) {
    throw new APIError(400, "Invalid tagged user id");
  }
  if (!videoIds.every((id) => isValidObjectId(id))) {
    throw new APIError(400, "Invalid tagged video id");
  }

  const ownerStr = ownerId.toString();
  if (userIds.some((id) => id.toString() === ownerStr)) {
    throw new APIError(400, "You cannot tag yourself");
  }

  const foundUsers = await User.find({ _id: { $in: userIds } }).select("_id");
  if (foundUsers.length !== userIds.length) {
    throw new APIError(400, "One or more tagged users do not exist");
  }

  const foundVideos = await Video.find({
    _id: { $in: videoIds },
    isPublished: true,
  }).select("_id");

  if (foundVideos.length !== videoIds.length) {
    throw new APIError(400, "One or more tagged videos do not exist or are unpublished");
  }

  return { userIds, videoIds };
}

export function validateTweetContent(content) {
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new APIError(400, "Tweet content required");
  }
  const trimmed = content.trim();
  if (trimmed.length < 10) {
    throw new APIError(400, "Tweet must be at least 10 characters");
  }
  if (trimmed.length > 500) {
    throw new APIError(400, "Tweet must be at most 500 characters");
  }
  return trimmed;
}
