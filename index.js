require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const { type } = require("node:os");
const cors = require("cors");
const { timeStamp } = require("node:console");
const cloudinary = require("cloudinary").v2;
const strict = require("node:assert/strict");
const authRoutes = require("./router/auth.routes");
const onboardRoutes = require("./router/onboarding.routes");
const BookRouter = require("./router/book.route");
const BookImportRouter = require("./router/BookImport.route");
const FeaturedRouter = require("./router/Featured.route");
const ReadingRouter = require("./router/reading.route");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/auth/users", onboardRoutes);
app.use("/api/import", BookImportRouter);
app.use("/api/books", BookRouter);
app.use("/api/featured", FeaturedRouter);
app.use("/api/reading", ReadingRouter);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongodb connected successfullly");
  })

  .catch((error) => {
    console.log("Cannot connect to database", error);
  });

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to Atlas successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose runtime connection error:", err);
});

const PORT = process.env.PORT || 5005;

app.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`server started successfully on port ${PORT}`);
  }
});
