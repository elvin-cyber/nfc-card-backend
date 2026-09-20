require("dotenv").config();
const connectDB = require("../src/config/db");
const Admin = require("../src/models/Admin");
const mongoose = require("mongoose");

(async () => {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const name = process.env.ADMIN_NAME || "System Admin";
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.");
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`[seed:admin] An administrator with email ${email} already exists. Nothing to do.`);
    } else {
      // First admin gets the top role so they can manage other administrator accounts.
      await Admin.create({ name, email, password, role: "MAIN_ADMIN" });
      console.log(`[seed:admin] Created main administrator account: ${email}`);
    }
  } catch (err) {
    console.error("[seed:admin] Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
