export type getBillingResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    plan: string;
    cardNumber: string;
    nameOfCard: string;
    expiryDate: string;
    cvv: string;
    billingEmail: string;
    cardAddress: string;
    city: string;
    country: string;
    zipCode: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type updateBillingType = {
  plan: string;
  cardNumber: string;
  nameOfCard: string;
  expiryDate: string;
  cvv: string;
  billingEmail: string;
  cardAddress: string;
  city: string;
  country: string;
  zipCode: string;
}

export type updateBillingResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    plan: string;
    cardNumber: string;
    nameOfCard: string;
    expiryDate: string;
    cvv: string;
    billingEmail: string;
    cardAddress: string;
    city: string;
    country: string;
    zipCode: string;
    createdAt: string;
    updatedAt: string;
  }
}

