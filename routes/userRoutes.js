import express from "express";
import path from "path";
import {
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  changePassword,
  getUser,
  updateUser,
  friendRequest,
  getfriendRequest,
  acceptRequest,
  profileViews,
  suggestedFriends,
} from "../controllers/userController.js";
import userAuth from "../middleware/authMiddleware.js";

const usersRouter = express.Router();
const __dirname = path.resolve(path.dirname(""));

usersRouter.get("/verify/:userId/:token", verifyEmail);

usersRouter.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build", "index.html"));
});

// PASSWORD RESET

// request password reset link
usersRouter.post("/request-passwordreset", requestPasswordReset);

// verify the link
usersRouter.get("/reset-password/:userId/:token", resetPassword);

// change password and submit the dorm
usersRouter.post("/reset-password", changePassword);

usersRouter.get("/resetpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build", "index.html"));
});

// user Routes
usersRouter.post("/get-user/:id?", userAuth, getUser);
usersRouter.put("/update-user", userAuth, updateUser);

// friend request
usersRouter.post("/friend-request", userAuth, friendRequest);
usersRouter.post("/get-friend-request", userAuth, getfriendRequest);

// accept or deny friend request
usersRouter.post("/accept-request", userAuth, acceptRequest);

// view profile
usersRouter.post("/profile-view", userAuth, profileViews);

// suggested friends
usersRouter.get("/suggested-friends", userAuth, suggestedFriends);

export default usersRouter;
