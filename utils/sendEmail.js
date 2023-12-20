import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./index.js";
import Verification from "../models/emailVerificationModel.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

let transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASSWORD,
  },
});

export const sendVerificationEmail = async (user, res) => {
  const { _id, email, lastName } = user;

  //create token
  const token = _id + uuidv4();

  //create link
  const link = APP_URL + "users/verify/" + _id + "/" + token;

  // mail options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Verify your email",
    html: `<div  style='font-family:Arial, sans-serif; font-size:20px; color:#333; background-color:#f5f5f5'>
            <h1 style="color:rgb(8, 56, 188)">Verify your email Address</h1>
            <hr />
            <h4>Hi ${lastName},</h4>
            <p>
              Please click on the link below to verify your email address
              <br />
              <p>This link <b>expires in 1 hour</b></p>
              <br />
              <a href=${link}
                 style="color:#fff; padding:14px; text-decoration:none; backgound-color:#000;">
                 Email Address
              </a>        
            </p>
           <div style="margin-top:20px">
             <h5>Best Regards</h5>
             <h5>Team Social Media</h5>
            </div>

          </div>`,
  };

  try {
    const hashedToken = await hashString(token);
    const newVerifiedEmail = await Verification.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    if (newVerifiedEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(200).json({
            success: "PENDING",
            message:
              "Verification email has been sent to your email account.Check your email for further instructions.",
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(404).json({ message: "Email not sent" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
