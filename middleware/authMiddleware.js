import { googleAuth } from "../config/googleAuth.js";

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.googleToken;

  if (!token) {
    // Store the original URL in the query string
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/auth/login?next=${returnTo}`);
  }

  const user = await googleAuth.verifyToken(token);
  if (!user) {
    res.clearCookie("googleToken");
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/auth/login?next=${returnTo}`);
  }

  // Check if user's email is in allowed list
  // const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
  // if (!allowedEmails.includes(user.email)) {
  //   return res.status(403).render("error", {
  //     error: "You are not authorized to access this application",
  //   });
  // }

  req.user = user;
  next();
};

export const setUserIfExists = async (req, res, next) => {
  const token = req.cookies?.googleToken;
  if (token) {
    req.user = await googleAuth.verifyToken(token);
  }
  next();
};
