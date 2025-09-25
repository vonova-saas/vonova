import UserBillingModel from "../../models/settings/userBilling.model";
import { NotFoundException } from "../../utils/appError";

//! ============ User Billing Service ============
export const getDefaultBilling = () => ({
  plan: "basic",
  cardNumber: "4242424242424242",
  nameOfCard: "John Doe",
  expiryDate: "MM/YY",
  cvv: "123",
  billingEmail: "billing@example.com",
  cardAddress: "123 Main St",
  city: "Cairo",
  country: "Egypt",
  zipCode: "10001",
});

export const getUserBillingService = async (userId: string) => {
  let billing = await UserBillingModel.findOne({ userId });

  if (!billing) {
    billing = await UserBillingModel.create({
      userId,
      ...getDefaultBilling(),
    });
  }

  return billing;
};

export const updateUserBillingService = async (userId: string, update: any) => {
  const billing = await UserBillingModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, runValidators: true, new: true }
  ).lean();

  if (!billing) {
    throw new NotFoundException("User billing not found");
  }

  return billing;
};
