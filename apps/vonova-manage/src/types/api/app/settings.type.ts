export type getSettingsResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    font: string;
    fontSize: string;
    theme: string;
    language: string;
    timezone: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type updateSettingsType = {
  font: string;
  fontSize: string;
  theme: string;
  language: string;
}

export type updateSettingsResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    font: string;
    fontSize: string;
    theme: string;
    language: string;
    timezone: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type resetSettingsResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    font: string;
    fontSize: string;
    theme: string;
    language: string;
    timezone: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  }
}

