import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/openRouteAuth.middleware.js";
import {
  getTweetComments,
  addTweetComment,
  replyToTweetComment,
  updateTweetComment,
  deleteTweetComment,
} from "../controllers/tweetComment.controller.js";

const router = Router();

router.route("/tweet/:tweetId").get(checkUser, getTweetComments).post(verifyJWT, addTweetComment);
router.route("/:commentId/reply").post(verifyJWT, replyToTweetComment);
router
  .route("/:commentId")
  .patch(verifyJWT, updateTweetComment)
  .delete(verifyJWT, deleteTweetComment);

export default router;
