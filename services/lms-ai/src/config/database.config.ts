import mongoose from "mongoose";
import { Env } from "./env.config";

const connectDatabase = async () => {
  try {
    // await mongoose.connect(Env.MONGO_URI_LOCAL);
    // console.log("Connected to Local Mongo database");
    await mongoose.connect(Env.MONGO_URI_RMOTE);
    console.log("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    // Don't exit in development - allow service to run for testing
    if (Env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDatabase;
