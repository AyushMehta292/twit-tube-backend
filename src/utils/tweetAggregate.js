import mongoose from "mongoose";

export function buildTweetAggregationPipeline({ match = {}, userId = null, includeIsOwner = false }) {
  const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

  return [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
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
        foreignField: "tweet",
        as: "dislikes",
        pipeline: [
          { $match: { liked: false } },
          { $group: { _id: "liked", owners: { $push: "$likedBy" } } },
        ],
      },
    },
    {
      $lookup: {
        from: "tweetcomments",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetComments",
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
        totalComments: { $size: "$tweetComments" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
      },
    },
    { $unwind: "$owner" },
    {
      $lookup: {
        from: "users",
        localField: "taggedUsers",
        foreignField: "_id",
        as: "taggedUsers",
        pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "taggedVideos",
        foreignField: "_id",
        as: "taggedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
            },
          },
          { $unwind: "$owner" },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        taggedUsers: 1,
        taggedVideos: 1,
        totalComments: 1,
        ...(includeIsOwner && userObjectId
          ? {
              isOwner: {
                $cond: {
                  if: { $eq: [userObjectId, "$owner._id"] },
                  then: true,
                  else: false,
                },
              },
            }
          : {}),
        totalLikes: { $size: "$likes" },
        totalDisLikes: { $size: "$dislikes" },
        isLiked: userObjectId
          ? { $cond: { if: { $in: [userObjectId, "$likes"] }, then: true, else: false } }
          : false,
        isDisLiked: userObjectId
          ? { $cond: { if: { $in: [userObjectId, "$dislikes"] }, then: true, else: false } }
          : false,
      },
    },
  ];
}
