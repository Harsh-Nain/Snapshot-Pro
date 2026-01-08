import jwt from "jsonwebtoken";

export const islogin = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) return res.redirect("/auth/login");

    jwt.verify(accessToken, "iuytrewqdsf", (err, user) => {

        if (!err && user) {
            req.user = user;
            return next();
        }

        jwt.verify(refreshToken, "iuytrewqdsf", (err2, user2) => {
            if (err2 || !user2) return res.redirect("/auth/login");

            const newAccess = jwt.sign({ username: user2.username, Id: user2.Id }, "iuytrewqdsf", { expiresIn: "15m" });

            res.cookie("accessToken", newAccess, { httpOnly: true, sameSite: "strict", secure: false });
            req.user = user2;
            return next();
        });
    });
}