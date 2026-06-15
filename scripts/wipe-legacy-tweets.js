import "dotenv/config";
import mongoose from "mongoose";
import { Tweet } from "../src/models/tweet.model.js";
import { Like } from "../src/models/like.model.js";

const uri = `${process.env.MONGODB_URL}/twit-tube`;

async function wipeLegacyTweets() {
  await mongoose.connect(uri);
  const tweetResult = await Tweet.deleteMany({});
  const likeResult = await Like.deleteMany({ tweet: { $exists: true } });
  console.log(`Deleted ${tweetResult.deletedCount} tweets`);
  console.log(`Deleted ${likeResult.deletedCount} tweet likes`);
  await mongoose.disconnect();
}

wipeLegacyTweets().catch((err) => {
  console.error(err);
  process.exit(1);
});
