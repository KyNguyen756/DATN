require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { startTripStatusCron } = require("./utils/tripStatusCron");

connectDB().then(() => {
  // Start automatic trip status updater only after DB is ready
  startTripStatusCron();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

