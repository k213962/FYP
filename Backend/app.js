require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDb = require("./db/db");
const userRoute = require("./routers/user.route");
const mapRoute = require("./routes/map.routes");
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
module.exports = app;