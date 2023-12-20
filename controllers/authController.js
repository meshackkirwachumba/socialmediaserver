import Users from "../models/userModel.js";
import { hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

export const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!(firstName || lastName || email || password)) {
    next("Please enter all fields");
    return;
  }

  try {
    //check if a user already exist
    const userExist = await Users.findOne({ email });

    if (userExist) {
      next("User already exist");
      return;
    }

    //hash password
    const hashedPassword = await hashString(password);

    //create user
    const user = await Users.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // if user is created send verification email
    sendVerificationEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
