import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import morgan from "morgan";
import dbConnection from "./dbConfig/index.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

// security packages
import helmet from "helmet";
import authRouter from "./routes/authRoutes.js";
import usersRouter from "./routes/userRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8800;

// connect to db
dbConnection();

// middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);

// error middleware
app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Dev Server running on port ${PORT}`));
