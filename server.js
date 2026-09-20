require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] NFC Connect API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
  }
})();
