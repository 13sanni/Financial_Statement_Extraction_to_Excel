import mongoose from "mongoose";
import { env, hasMongoConfig } from "./env";

let connectionAttempted = false;

export async function connectDatabase(): Promise<void> {
  if (connectionAttempted) return;
  connectionAttempted = true;

  if (!hasMongoConfig()) {
    console.warn("MONGO_URI is not configured. Metadata persistence is disabled.");
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected.");
}
