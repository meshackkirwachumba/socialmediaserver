import Users from "../models/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
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

    // if user is created send verification email to user email
    sendVerificationEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // validation
    if (!email || !password) {
      next("Please enter all fields");
      return;
    }

    // check if user exist
    const user = await Users.findOne({ email }).select("+password").populate({
      path: "friends",
      select: "firstName lastName location profileUrl -password",
    });

    // if user does not exist
    if (!user) {
      next("invalid credentials");
      return;
    }

    // check if user has verified his or her account
    if (!user?.verified) {
      next("Please check your email to verify your account");
      return;
    }

    // check if password is correct
    const isMatch = await compareString(password, user?.password);

    if (!isMatch) {
      next("invalid credentials");
      return;
    }

    // if password is correct
    user.password = undefined;

    //create token
    const token = createJWT(user?._id);

    // send token and user as res
    res.status(201).json({
      success: true,
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {}
};
