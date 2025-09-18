import mongoose, { Document, Schema } from "mongoose";

export interface UserBillingDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  plan?: string,
  cardNumber?: string,
  nameOfCard?: string,
  expiryDate?: string,
  cvv?: string,
  billingEmail?: string,
  cardAddress?: string,
  city?: string,
  country?: string,
  zipCode?: string,
}

const userBillingSchema = new Schema<UserBillingDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      trim: true,
    },
    cardNumber: {
      type: String,
      unique: true,
      trim: true
    },
    nameOfCard: {
      type: String,
      default: null,
    },
    expiryDate: {
      type: String,
      default: null,
    },
    cvv: {
      type: String,
      default: null,
    },
    billingEmail: {
      type: String,
      default: null,
    },
    cardAddress: {
      type: String,
      maxlength: 500,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    zipCode: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Add index for faster lookups
userBillingSchema.index({ userId: 1 }, { unique: true });

const UserBillingModel = mongoose.model<UserBillingDocument>("UserBilling", userBillingSchema);
export default UserBillingModel;