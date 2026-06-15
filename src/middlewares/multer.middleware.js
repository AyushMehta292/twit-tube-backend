import multer from "multer";
import os from "os";
import path from "path";

const uploadDir = process.env.VERCEL
  ? os.tmpdir()
  : path.join(process.cwd(), "public", "temp");

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
