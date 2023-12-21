import Verification from "../models/emailVerificationModel.js";
import FriendRequest from "../models/friendRequestModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import Users from "../models/userModel.js";
import { compareString, createJWT } from "../utils/index.js";
import { resetPasswordLink } from "../utils/sendEmail.js";

export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    //   check if user exist in email verification collection
    const result = await Verification.findOne({ userId });

    if (result) {
      const { expiresAt, token: hashedToken } = result;

      //   check if token is expired
      if (expiresAt < Date.now()) {
        // delete the verification data
        Verification.findOneAndDelete({ userId })
          .then(() => {
            Users.findOneAndDelete({ _id: userId })
              .then(() => {
                const message =
                  "Verification link expired. Please signup again.";
                res.redirect(`/users/verified?status=error&message=${message}`);
              })
              .catch((err) => {
                res.redirect(`/users/verified?status=error&message=`);
              });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).json({ message: error.message });
          });
      } else {
        // check if token is valid
        compareString(token, hashedToken)
          .then((match) => {
            if (match) {
              Users.findOneAndUpdate({ _id: userId }, { verified: true })
                .then(() => {
                  Verification.findOneAndDelete({ userId })
                    .then(() => {
                      const message = "Email verified successfully.";
                      res.redirect(
                        `/users/verified?status=success&message=${message}`
                      );
                    })
                    .catch((error) => {
                      const message =
                        "Email verification failed. Please try again.";
                      console.log(error);
                      res.redirect(
                        `/users/verified?status=error&message=${message}`
                      );
                    });
                })
                .catch((error) => {
                  console.log(error);
                  res.redirect(`/users/verified?status=error&message=`);
                });
            } else {
              const message = "Verification link expired. Please signup again.";
              res.redirect(`/users/verified?status=error&message=${message}`);
            }
          })
          .catch((error) => {
            console.log(error);
            res.redirect(`/users/verified?message=`);
          });
      }
    } else {
      const message = "Verification link expired. Please signup again.";
      res.redirect(`/users/verified?status=error&message=${message}`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "Email address not found" });
    }

    // check if the user had requested a password reset
    const existingPasswordResetRequest = await PasswordReset.findOne({ email });
    if (existingPasswordResetRequest) {
      if (existingPasswordResetRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "PENDING",
          message:
            "Password reset request already sent. Please check your email.",
        });
      }

      // if it has expired, delete it
      await PasswordReset.findOneAndDelete({ email });
    }

    // send password reset link
    await resetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// check if token and userId is valid
export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    //find record
    const user = await Users.findById(userId);

    if (!user) {
      const message = "Invalid password reset link. Please try again.";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    // if user is found grab if there is password reset account
    const resetPasswordAccount = await PasswordReset.findOne({ userId });

    if (!resetPasswordAccount) {
      const message = "Invalid password reset link. Please try again.";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    // if resetPasswordAccount exists
    const { expiresAt, token: resetToken } = resetPasswordAccount;

    // check if token is expired
    if (expiresAt < Date.now()) {
      const message = "Password reset link has expired. Please try again.";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    } else {
      const isMatch = await compareString(token, resetToken);

      if (isMatch) {
        res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
      } else {
        const message = "Invalid password reset link. Please try again.";
        res.redirect(`/users/resetpassword?status=error&message=${message}`);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const hashedPassword = await hashString(password);

    const user = await Users.findByIdAndUpdate(
      { _id: userId },
      { password: hashedPassword }
    );

    // if successful update
    if (user) {
      await PasswordReset.findOneAndDelete({ userId });

      const message = "Password changed successfully.";
      res.redirect(`/users/resetpassword?status=success&message=${message}`);

      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    const user = await Users.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });

    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false,
      });
    }

    // if there is a user
    user.password = undefined;

    res.status(200).json({ user, success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, location, profileUrl, profession, contact } =
      req.body;

    if (
      !(
        firstName ||
        lastName ||
        location ||
        profileUrl ||
        profession ||
        contact
      )
    ) {
      next("All fields are required");
      return;
    }

    const { userId } = req.body.user;

    const updateUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
      _id: userId,
    };

    const user = await Users.findByIdAndUpdate({ _id: userId }, updateUser, {
      new: true,
    });

    await user.populate({
      path: "friends",
      select: "-password",
    });

    user.password = undefined;

    const token = createJWT(user._id);

    res
      .status(200)
      .json({ user, success: true, token, message: "User updated" });
  } catch (error) {}
};

// send friend request
export const friendRequest = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { requestTo } = req.body;
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }

  // check if friend request already sent
  const friendRequestExist = await FriendRequest.findOne({
    requestFrom: userId,
    requestTo: requestTo,
  });

  if (friendRequestExist) {
    next("Friend request already sent");
    return;
  }

  // check if the person has already sent a friend request to me ie userId
  const accountEXist = await FriendRequest.findOne({
    requestFrom: requestTo,
    requestTo: userId,
  });

  if (accountEXist) {
    next("Friend request already sent");
    return;
  }

  // if none of the above has sent any friend request
  const newFriendRequest = await FriendRequest.create({
    requestTo: requestTo,
    requestFrom: userId,
  });

  res.status(200).json({ success: true, message: "Friend request sent" });
};

// get friend request
export const getfriendRequest = async (req, res) => {
  try {
    const { userId } = req.body.user;

    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({ _id: -1 });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

// accept or deny friend request
export const acceptRequest = async (req, res) => {
  try {
    const id = req.body.user.userId;
    const { rid, status } = req.body;

    const requestExist = await FriendRequest.findById(rid);

    if (!requestExist) {
      next("Friend request not found");
      return;
    }

    const newRes = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status },
      { new: true }
    );

    if (status === "Accepted") {
      const user = await Users.findById(id);

      // add friend id to friends array
      user.friends.push(newRes?.requestFrom);

      await user.save();

      // add user id to friends array
      const friend = await Users.findById(newRes?.requestFrom);

      friend.friends.push(newRes?.requestTo);

      await friend.save();
    }

    res.status(201).json({ success: true, message: "Friend request" + status });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

// view profile
export const profileViews = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.body;

    const user = await Users.findById(id);

    user.views.push(userId);

    await user.save();

    res.status(201).json({ success: true, message: "Profile viewed" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};

//suggested friends
export const suggestedFriends = async (req, res) => {
  try {
    const { userId } = req.body.user;

    let queryObject = {};

    queryObject._id = { $ne: userId };

    queryObject.friends = { $nin: userId };

    let queryResult = Users.find(queryObject)
      .limit(15)
      .select("firstName lastName profileUrl, profession -password");

    const suggestedFriends = await queryResult;

    res.status(201).json({ success: true, data: suggestedFriends });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "auth error", success: false, error: error.message });
  }
};
