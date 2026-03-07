require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB connected");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
