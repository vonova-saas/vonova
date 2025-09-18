import mongoose, { Document, Schema } from "mongoose";

interface RefreshTokenDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  tokenHash: string;
  jti: string;
  deviceHash: string;
  expiresAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>({
  jti: {
    type: String,
    required: true,
    unique: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deviceHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: {
      expires: 0 // Auto-expire
    }
  },
});

refreshTokenSchema.index({ jti: 1, userId: 1 });

const RefreshTokenModel = mongoose.model<RefreshTokenDocument>(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshTokenModel;