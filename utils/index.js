import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashString = async (str) => {
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(str, salt);

  return hashedPassword;
};

export const compareString = async (userPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(userPassword, hashedPassword);

  return isMatch;
};

//JSON WEB TOKEN

export function createJWT(id) {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
}
