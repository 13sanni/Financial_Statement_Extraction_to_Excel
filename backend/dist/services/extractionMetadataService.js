"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExtractionRunMetadata = saveExtractionRunMetadata;
const env_1 = require("../config/env");
const extractionRun_1 = require("../models/extractionRun");
async function saveExtractionRunMetadata(input) {
    if (!(0, env_1.hasMongoConfig)())
        return;
    await extractionRun_1.ExtractionRunModel.create(input);
}
