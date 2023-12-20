import Verification from "../models/emailVerificationModel.js";
import Users from "../models/userModel.js";
import { compareString } from "../utils.js";

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
            res.redirect(`/users/verified?status=error&message=`);
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
