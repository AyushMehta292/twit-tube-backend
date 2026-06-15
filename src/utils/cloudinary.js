import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPhotoOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    console.log("uploading thumbnail...");

    //Uploading File to Cloudinary
    const cldnry_res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "videotube/photos",
    });

    // File Uploaded Successfully & Removing File From Local System
    fs.unlinkSync(localFilePath);
    return cldnry_res;
  } catch (error) {
    fs.unlinkSync(localFilePath); //Removing File From Local System
    console.log("CLOUDINARY :: FILE UPLOAD ERROR ", error);
    return null;
  }
};

const uploadVideoOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    console.log("uploading video...");

    //Uploading File to Cloudinary
    const cldnry_res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
      folder: "videotube/videos",
    });

    // File Uploaded Successfully & Removing File From Local System
    fs.unlinkSync(localFilePath);

    return cldnry_res;
  } catch (error) {
    fs.unlinkSync(localFilePath); //Removing File From Local System
    console.log("CLOUDINARY :: FILE UPLOAD ERROR ", error);
    return null;
  }
};

const deleteImageOnCloudinary = async (URL) => {
  try {
    if (!URL) return false;

    let ImageId = URL.match(
      /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
    )[2];

    console.log("deleting image from cloudinary...");

    const cldnry_res = await cloudinary.uploader.destroy(
      `videotube/photos/${ImageId}`,
      {
        resource_type: "image",
      }
    );

    return cldnry_res;
  } catch (error) {
    console.log("CLOUDINARY :: FILE Delete ERROR ", error);
    return false;
  }
};

const deleteVideoOnCloudinary = async (URL) => {
  try {
    if (!URL) return false;

    let VideoId = URL.match(
      /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
    )[2];

    console.log("deleting video from cloudinary...");

    const cldnry_res = await cloudinary.uploader.destroy(
      `videotube/videos/${VideoId}`,
      {
        resource_type: "video",
      }
    );

    return cldnry_res;
  } catch (error) {
    console.log("CLOUDINARY :: FILE Delete ERROR ", error);
    return false;
  }
};

const UPLOAD_FOLDERS = {
  video: "videotube/videos",
  image: "videotube/photos",
};

const getSignedUploadParams = (resourceType) => {
  const folder = UPLOAD_FOLDERS[resourceType];
  if (!folder) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
    resource_type: resourceType,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    resourceType,
  };
};

const isValidCloudinaryAssetUrl = (url, resourceType) => {
  if (!url || typeof url !== "string") return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const folder = UPLOAD_FOLDERS[resourceType];
  if (!cloudName || !folder) return false;

  const uploadSegment = resourceType === "video" ? "video" : "image";
  const escapedCloud = cloudName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedFolder = folder.replace(/\//g, "\\/");

  const pattern = new RegExp(
    `^https://res\\.cloudinary\\.com/${escapedCloud}/${uploadSegment}/upload/v\\d+/${escapedFolder}/.+$`
  );

  return pattern.test(url);
};

export {
  uploadPhotoOnCloudinary,
  uploadVideoOnCloudinary,
  deleteImageOnCloudinary,
  deleteVideoOnCloudinary,
  getSignedUploadParams,
  isValidCloudinaryAssetUrl,
};
