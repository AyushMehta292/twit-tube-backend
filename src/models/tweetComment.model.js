import mongoose, { Schema } from "mongoose";

const tweetCommentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      required: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "TweetComment",
      default: null,
    },
  },
  { timestamps: true }
);

tweetCommentSchema.index({ tweet: 1, createdAt: -1 });
tweetCommentSchema.index({ parentComment: 1 });

export const TweetComment = mongoose.model("TweetComment", tweetCommentSchema);
