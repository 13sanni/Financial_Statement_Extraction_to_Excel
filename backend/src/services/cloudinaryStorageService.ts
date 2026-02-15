import { UploadApiResponse } from "cloudinary";
import { Readable } from "stream";
import { getCloudinary } from "../config/cloudinary";
import { env, hasCloudinaryConfig } from "../config/env";
import { AppError } from "../utils/appError";

type UploadOptions = {
  folderPath: string;
  fileName: string;
};

function uploadBuffer(buffer: Buffer, fileName: string, folderPath: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const cloudinary = getCloudinary();
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folderPath,
        use_filename: true,
        unique_filename: true,
        filename_override: fileName,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload result is empty."));
        resolve(result);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadRawBufferToCloudinary(
  buffer: Buffer,
  options: UploadOptions,
): Promise<{ publicId: string; secureUrl: string; bytes: number; format: string }> {
  if (!hasCloudinaryConfig()) {
    throw new AppError("Cloudinary is not configured. Set CLOUDINARY_* environment variables.", 500);
  }

  const folderPath = `${env.cloudinaryFolder}/${options.folderPath}`;
  const result = await uploadBuffer(buffer, options.fileName, folderPath);
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    format: result.format || "",
  };
}
