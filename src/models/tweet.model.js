import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
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
    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    taggedVideos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

tweetSchema.index({ owner: 1, createdAt: -1 });
tweetSchema.index({ taggedUsers: 1, createdAt: -1 });
tweetSchema.index({ taggedVideos: 1, createdAt: -1 });

export const Tweet = mongoose.model("Tweet", tweetSchema);
