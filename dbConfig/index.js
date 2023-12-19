import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    const dbConnection = await mongoose.connect(process.env.MONGODB_URL, {});

    console.log("DB connected", dbConnection.connection.host);
  } catch (error) {
    console.log("DB connection error", error);
  }
};

export default dbConnection;
