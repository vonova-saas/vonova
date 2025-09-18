import { z } from "zod";

export const updateUserBillingSchema = z.object({
  plan: z.string().optional(),
  cardNumber: z.string().optional(),
  nameOfCard: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  billingEmail: z.string().email().optional(),
  cardAddress: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  zipCode: z.string().max(20).nullable().optional(),
});
