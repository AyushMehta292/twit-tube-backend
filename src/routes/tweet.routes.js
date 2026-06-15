import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/openRouteAuth.middleware.js";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getAllTweets,
  getAllUserFeedTweets,
  getRelevantTweets,
  getTweetById,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/feed").get(checkUser, getAllUserFeedTweets);
router.route("/relevant").get(verifyJWT, getRelevantTweets);
router.route("/").get(checkUser, getAllTweets).post(verifyJWT, createTweet);
router.route("/users/:userId").get(checkUser, getUserTweets);
router
  .route("/:tweetId")
  .get(checkUser, getTweetById)
  .patch(verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet);

export default router;
