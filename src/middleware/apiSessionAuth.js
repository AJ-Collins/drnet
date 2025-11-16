function apiSessionAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Session expired or not logged in",
      redirectUrl: "/login",
    });
  }

  next();
}

module.exports = apiSessionAuth;
