import jwt from "jsonwebtoken";

export const islogin = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  console.log('tokens', accessToken, refreshToken, req.cookies)
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  jwt.verify(accessToken, "iuytrewqdsf", (err, user) => {
    if (!err && user) {
      req.user = user;
      console.log('ok');
      return next();
    }

    jwt.verify(refreshToken, "iuytrewqdsf", (err2, user2) => {
      if (err2 || !user2) {
        return res.status(401).json({ message: "Session expired" });
      }

      const newAccess = jwt.sign({ username: user2.username, Id: user2.Id }, "iuytrewqdsf", { expiresIn: "15m" });
      res.cookie("accessToken", newAccess, { httpOnly: true, sameSite: "lax", secure: false, });
      req.user = user2;
      next();
    });
  });
};