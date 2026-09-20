function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || { field: 1 })[0];
    return res.status(409).json({ message: `This ${field} is already in use.` });
  }

  if (err && err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(" ");
    return res.status(400).json({ message: message || "Invalid data." });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Something went wrong on the server." });
}

module.exports = { notFound, errorHandler };
