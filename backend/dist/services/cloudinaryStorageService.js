"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRawBufferToCloudinary = uploadRawBufferToCloudinary;
const stream_1 = require("stream");
const cloudinary_1 = require("../config/cloudinary");
const env_1 = require("../config/env");
function uploadBuffer(buffer, fileName, folderPath, resourceType) {
    return new Promise((resolve, reject) => {
        const cloudinary = (0, cloudinary_1.getCloudinary)();
        const stream = cloudinary.uploader.upload_stream({
            resource_type: resourceType,
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
        return {
            publicId: "",
            secureUrl: "",
            bytes: buffer.length,
            format: "",
        };
    }
    const folderPath = `${env_1.env.cloudinaryFolder}/${options.folderPath}`;
    const result = await uploadBuffer(buffer, options.fileName, folderPath, options.resourceType || "raw");
    return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        bytes: result.bytes,
        format: result.format || "",
    };
}
