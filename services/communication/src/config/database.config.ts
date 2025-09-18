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
    process.exit(1);
  }
};

export default connectDatabase;
