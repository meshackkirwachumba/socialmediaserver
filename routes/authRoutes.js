import express from "express";
import { login, register } from "../controllers/authController.js";

const authRouter = express.Router();

router.post("/register", register);
router.post("/login", login);

export default authRouter;
