"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRawBufferToCloudinary = uploadRawBufferToCloudinary;
const stream_1 = require("stream");
const cloudinary_1 = require("../config/cloudinary");
const env_1 = require("../config/env");
const appError_1 = require("../utils/appError");
function uploadBuffer(buffer, fileName, folderPath) {
    return new Promise((resolve, reject) => {
        const cloudinary = (0, cloudinary_1.getCloudinary)();
        const stream = cloudinary.uploader.upload_stream({
            resource_type: "raw",
            folder: folderPath,
            use_filename: true,
            unique_filename: true,
            filename_override: fileName,
        }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error("Cloudinary upload result is empty."));
            resolve(result);
        });
        stream_1.Readable.from(buffer).pipe(stream);
    });
}
async function uploadRawBufferToCloudinary(buffer, options) {
    if (!(0, env_1.hasCloudinaryConfig)()) {
        throw new appError_1.AppError("Cloudinary is not configured. Set CLOUDINARY_* environment variables.", 500);
    }
    const folderPath = `${env_1.env.cloudinaryFolder}/${options.folderPath}`;
    const result = await uploadBuffer(buffer, options.fileName, folderPath);
    return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        bytes: result.bytes,
        format: result.format || "",
    };
}
