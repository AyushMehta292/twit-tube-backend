import mongoose, { isValidObjectId } from "mongoose";
import { TweetComment } from "../models/tweetComment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const commentLikeStages = (userId) => [
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "tweetComment",
      as: "likes",
      pipeline: [
        { $match: { liked: true } },
        { $group: { _id: "liked", owners: { $push: "$likedBy" } } },
      ],
    },
  },
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "tweetComment",
      as: "dislikes",
      pipeline: [
        { $match: { liked: false } },
        { $group: { _id: "liked", owners: { $push: "$likedBy" } } },
      ],
    },
  },
  {
    $addFields: {
      likes: {
        $cond: {
          if: { $gt: [{ $size: "$likes" }, 0] },
          then: { $first: "$likes.owners" },
          else: [],
        },
      },
      dislikes: {
        $cond: {
          if: { $gt: [{ $size: "$dislikes" }, 0] },
          then: { $first: "$dislikes.owners" },
          else: [],
        },
      },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1, _id: 1 } }],
    },
  },
  { $unwind: "$owner" },
  {
    $project: {
      content: 1,
      owner: 1,
      createdAt: 1,
      updatedAt: 1,
      parentComment: 1,
      isOwner: {
        $cond: {
          if: { $eq: [userId ? new mongoose.Types.ObjectId(userId) : null, "$owner._id"] },
          then: true,
          else: false,
        },
      },
      likesCount: { $size: "$likes" },
      disLikesCount: { $size: "$dislikes" },
      isLiked: userId
        ? { $cond: { if: { $in: [new mongoose.Types.ObjectId(userId), "$likes"] }, then: true, else: false } }
        : false,
      isDisLiked: userId
        ? { $cond: { if: { $in: [new mongoose.Types.ObjectId(userId), "$dislikes"] }, then: true, else: false } }
        : false,
    },
  },
];

const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new APIError(400, "Invalid tweetId");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new APIError(404, "Tweet not found");

  const topLevel = await TweetComment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
        $or: [{ parentComment: null }, { parentComment: { $exists: false } }],
      },
    },
    { $sort: { createdAt: -1 } },
    ...commentLikeStages(req.user?._id),
    {
      $lookup: {
        from: "tweetcomments",
        let: { parentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$parentComment", "$$parentId"] },
            },
          },
          { $sort: { createdAt: 1 } },
          ...commentLikeStages(req.user?._id),
        ],
        as: "replies",
      },
    },
  ]);

  return res
    .status(200)
    .json(new APIResponse(200, topLevel, "Tweet comments fetched successfully"));
});

const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) throw new APIError(400, "Invalid tweetId");
  if (!content?.trim()) throw new APIError(400, "Comment content required");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new APIError(404, "Tweet not found");

  const comment = await TweetComment.create({
    content: content.trim(),
    tweet: tweetId,
    owner: req.user._id,
    parentComment: null,
  });

  const commentData = {
    ...comment._doc,
    owner: {
      username: req.user.username,
      avatar: req.user.avatar,
      fullName: req.user.fullName,
      _id: req.user._id,
    },
    likesCount: 0,
    disLikesCount: 0,
    isOwner: true,
    isLiked: false,
    isDisLiked: false,
    replies: [],
  };

  return res
    .status(200)
    .json(new APIResponse(200, commentData, "Comment added successfully"));
});

const replyToTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) throw new APIError(400, "Invalid commentId");
  if (!content?.trim()) throw new APIError(400, "Reply content required");

  const parent = await TweetComment.findById(commentId);
  if (!parent) throw new APIError(404, "Parent comment not found");

  const reply = await TweetComment.create({
    content: content.trim(),
    tweet: parent.tweet,
    owner: req.user._id,
    parentComment: parent._id,
  });

  const replyData = {
    ...reply._doc,
    owner: {
      username: req.user.username,
      avatar: req.user.avatar,
      fullName: req.user.fullName,
      _id: req.user._id,
    },
    likesCount: 0,
    disLikesCount: 0,
    isOwner: true,
    isLiked: false,
    isDisLiked: false,
  };

  return res
    .status(200)
    .json(new APIResponse(200, replyData, "Reply added successfully"));
});

const updateTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) throw new APIError(400, "Invalid commentId");
  if (!content?.trim()) throw new APIError(400, "Comment content required");

  const comment = await TweetComment.findById(commentId);
  if (!comment) throw new APIError(404, "Comment not found");
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new APIError(403, "Only the comment owner can edit");
  }

  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new APIResponse(200, comment, "Comment updated successfully"));
});

const deleteTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) throw new APIError(400, "Invalid commentId");

  const comment = await TweetComment.findById(commentId);
  if (!comment) throw new APIError(404, "Comment not found");
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new APIError(403, "Only the comment owner can delete");
  }

  const replyIds = await TweetComment.find({ parentComment: commentId }).distinct("_id");
  const allIds = [comment._id, ...replyIds];

  await Like.deleteMany({ tweetComment: { $in: allIds } });
  await TweetComment.deleteMany({ $or: [{ _id: commentId }, { parentComment: commentId }] });

  return res
    .status(200)
    .json(new APIResponse(200, { isDeleted: true }, "Comment deleted successfully"));
});

export {
  getTweetComments,
  addTweetComment,
  replyToTweetComment,
  updateTweetComment,
  deleteTweetComment,
};
