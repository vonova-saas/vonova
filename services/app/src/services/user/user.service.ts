import UserModel from "../../models/auth/user.model";
import { NotFoundException, UnauthorizedException } from "../../utils/appError";
import { AccessTPayload, verifyJwtToken } from "../../utils/jwt";

export const getCurrentUserService = async (accessToken: string) => {
  const { payload } = verifyJwtToken<AccessTPayload>(accessToken);

  if (!payload) {
    throw new UnauthorizedException("Invalid access token unauthorized");
  }

  const user = await UserModel.findById(payload.userId)
    .populate("isVerified")
    .select("-password");

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return {
    user,
  };
};
