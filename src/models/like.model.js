import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    liked: {
      type: Boolean,
      default: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    tweetComment: {
      type: Schema.Types.ObjectId,
      ref: "TweetComment",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
