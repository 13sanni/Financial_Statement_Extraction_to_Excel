import { v2 as cloudinary } from "cloudinary";
import { env, hasCloudinaryConfig } from "./env";

let configured = false;

export function getCloudinary() {
  if (!configured && hasCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}
