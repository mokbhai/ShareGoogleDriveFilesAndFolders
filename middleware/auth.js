export const isAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminKey = adminKey;
  next();
};
