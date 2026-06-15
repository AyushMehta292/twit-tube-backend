import { Router } from "express";
import {
  getAllVideos,
  getUploadSignature,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateView,
  getAllVideosByOption,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkUser } from "../middlewares/openRouteAuth.middleware.js";

const router = Router();

// http://localhost:3000/api/v1/videos/...

router.route("/all/option").get(getAllVideosByOption);
router.route("/upload-signature").get(verifyJWT, getUploadSignature);

router.route("/").get(getAllVideos).post(verifyJWT, publishAVideo);

router
  .route("/:videoId")
  .get(checkUser, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/view/:videoId").patch(checkUser, updateView);

export default router;