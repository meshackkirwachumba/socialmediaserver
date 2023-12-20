import express from "express";
import path from "path";
import { verifyEmail } from "../controllers/userController.js";

const usersRouter = express.Router();
const __dirname = path.resolve(path.dirname(""));

usersRouter.get("/verify/:userId/:token", verifyEmail);

usersRouter.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/verifiedpage.html"));
});
export default usersRouter;
