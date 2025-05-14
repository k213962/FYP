require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user.routes");
const captainRoutes = require("./routes/captain.routes");
const mapRoutes = require("./routes/map.routes");
const rideRoutes = require("./routes/ride.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/user", userRoutes);
app.use("/captain", captainRoutes);
app.use("/map", mapRoutes);
app.use("/rides", rideRoutes);
app.use("/notifications", notificationRoutes);
app.use("/test", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
