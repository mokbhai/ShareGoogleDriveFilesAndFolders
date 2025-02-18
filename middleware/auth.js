export const isAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;

  if (adminKey !== process.env.ADMIN_KEY) {
    // For API requests
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // For regular requests, render the unauthorized page
    return res.status(401).render("unauthorized", {
      serviceEmail: process.env.SERVICE_EMAIL,
    });
  }

  req.adminKey = adminKey;
  next();
};
