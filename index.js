require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://afri-read-co.vercel.app",
    ...String(process.env.CLIENT_URLS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

const corsOriginHandler = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error("Not allowed by CORS"));
};

// Import routes
const authRoutes = require("./router/auth.routes");
const onboardRoutes = require("./router/onboarding.routes");
const BookRouter = require("./router/book.route");
const BookImportRouter = require("./router/BookImport.route");
const FeaturedRouter = require("./router/Featured.route");
const ReadingRouter = require("./router/reading.route");
const clubRoutes = require("./router/clubRoutes.routes");

// Import socket handlers
const clubSocket = require("./socket/clubSocket");

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: corsOriginHandler,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/users", onboardRoutes);
app.use("/api/import", BookImportRouter);
app.use("/api/books", BookRouter);
app.use("/api/featured", FeaturedRouter);
app.use("/api/reading", ReadingRouter);
app.use('/api/clubs', clubRoutes);

// Health check endpoint
app.get('/health', (req, res) => res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
}));

// Socket.IO connection handling
clubSocket(io);

// MongoDB Connection
// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully to Atlas");
  })
  .catch((error) => {
    console.error("Cannot connect to database:", error);
    process.exit(1);
  });

// MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to Atlas successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose runtime connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from Atlas.");
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection close:', err);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 5005;
server.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  } else {
    console.log(`Server started successfully on port ${PORT}`);
    console.log(`Socket.IO server is ready for connections`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }
});