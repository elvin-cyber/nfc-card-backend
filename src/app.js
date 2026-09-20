const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cardRoutes = require("./routes/cardRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminCardRoutes = require("./routes/adminCardRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());

// Generous body limit: profile photos, cover photos and resumes are sent as base64 data URLs.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/public/cards", publicRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/cards", adminCardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;