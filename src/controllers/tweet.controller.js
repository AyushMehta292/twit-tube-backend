import { Tweet } from "../models/tweet.model.js";
import { TweetComment } from "../models/tweetComment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildTweetAggregationPipeline } from "../utils/tweetAggregate.js";
import {
  validateTweetContent,
  validateTweetTags,
} from "../utils/tweetValidation.js";

const assertTweetOwner = async (tweetId, userId) => {
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new APIError(404, "Tweet not found");
  if (tweet.owner.toString() !== userId.toString()) {
    throw new APIError(403, "Only the tweet owner can perform this action");
  }
  return tweet;
};

const createTweet = asyncHandler(async (req, res) => {
  const { content, taggedUsers, taggedVideos } = req.body;

  const trimmedContent = validateTweetContent(content);
  const { userIds, videoIds } = await validateTweetTags({
    ownerId: req.user._id,
    taggedUsers,
    taggedVideos,
  });

  const tweetRes = await Tweet.create({
    content: trimmedContent,
    owner: req.user._id,
    taggedUsers: userIds,
    taggedVideos: videoIds,
  });

  const [newTweet] = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: { _id: tweetRes._id },
      userId: req.user._id,
      includeIsOwner: true,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, newTweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId))
    throw new APIError(400, "Invalid userId: " + userId);

  const allTweets = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: { owner: new mongoose.Types.ObjectId(userId) },
      userId: req.user?._id,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, allTweets, "all tweets send successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const allTweets = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      userId: req.user?._id,
      includeIsOwner: true,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, allTweets, "all tweets send successfully"));
});

const getRelevantTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userVideoIds = await Video.find({ owner: userId, isPublished: true }).distinct("_id");

  const allTweets = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: {
        $or: [
          { owner: userId },
          { taggedUsers: userId },
          { taggedVideos: { $in: userVideoIds } },
        ],
      },
      userId: userId.toString(),
      includeIsOwner: true,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, allTweets, "relevant tweets sent successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new APIError(400, "Invalid tweetId");

  const tweets = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: { _id: new mongoose.Types.ObjectId(tweetId) },
      userId: req.user?._id,
      includeIsOwner: true,
    })
  );

  if (!tweets.length) throw new APIError(404, "Tweet not found");

  return res
    .status(200)
    .json(new APIResponse(200, tweets[0], "tweet fetched successfully"));
});

const getAllUserFeedTweets = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriber: req.user?._id });
  const subscribedChannels = subscriptions.map((item) => item.channel);

  const allTweets = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: { owner: { $in: subscribedChannels } },
      userId: req.user?._id,
      includeIsOwner: true,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, allTweets, "all tweets send successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const content = req.body.content ?? req.body.tweet;

  if (!isValidObjectId(tweetId)) throw new APIError(400, "Invalid tweetId");
  await assertTweetOwner(tweetId, req.user._id);

  const trimmedContent = validateTweetContent(content);

  await Tweet.findByIdAndUpdate(tweetId, { $set: { content: trimmedContent } });

  const [updatedTweet] = await Tweet.aggregate(
    buildTweetAggregationPipeline({
      match: { _id: new mongoose.Types.ObjectId(tweetId) },
      userId: req.user._id,
      includeIsOwner: true,
    })
  );

  return res
    .status(200)
    .json(new APIResponse(200, updatedTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) throw new APIError(400, "Invalid tweetId");

  const tweet = await assertTweetOwner(tweetId, req.user._id);

  const comments = await TweetComment.find({ tweet: tweetId }).select("_id");
  const commentIds = comments.map((c) => c._id);

  await Like.deleteMany({
    $or: [
      { tweet: tweetId },
      { tweetComment: { $in: commentIds } },
    ],
  });
  await TweetComment.deleteMany({ tweet: tweetId });
  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new APIResponse(200, tweet, "tweet deleted successfully"));
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getAllTweets,
  getAllUserFeedTweets,
  getRelevantTweets,
  getTweetById,
};
