"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudinary = getCloudinary;
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
let configured = false;
function getCloudinary() {
    if (!configured && (0, env_1.hasCloudinaryConfig)()) {
        cloudinary_1.v2.config({
            cloud_name: env_1.env.cloudinaryCloudName,
            api_key: env_1.env.cloudinaryApiKey,
            api_secret: env_1.env.cloudinaryApiSecret,
            secure: true,
        });
        configured = true;
    }
    return cloudinary_1.v2;
}
