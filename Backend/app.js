require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDb = require("./db/db");
const userRoute = require("./routes/user.routes");
const mapRoute = require("./routes/map.routes");
const captainRoute = require("./routes/captain.routes");
const rideRoute = require("./routes/ride.routes");
const app = express();


connectToDb();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello from Express!" });
});
app.use("/test", (req, res) => {
    res.json({ message: "Hello from Express!" });
});
app.use("/users", userRoute);
app.use("/map", mapRoute);
app.use("/captain", captainRoute);
app.use("/rides", rideRoute);
module.exports = app;