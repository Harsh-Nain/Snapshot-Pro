import { RequestUser, SuggsionId, Follower, Following } from "../config/funstions.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users, posts, followRequests } from "../db/schems.js";
import { eq, and, or, desc, not } from "drizzle-orm";

/* =========================
   REGISTER USER
========================= */
export const saveuser = async (req, res) => {
    try {
        const { fullname, username, password, email } = req.body;

        const existingUser = await db
            .select()
            .from(users)
            .where(or(eq(users.Username, username), eq(users.Email, email)))
            .limit(1);

        if (existingUser.length > 0) {
            return res.json({
                success: false,
                message: "Username or email already exists",
            });
        }

        const securePassword = await bcrypt.hash(password, 10);

        await db.insert(users).values({
            Username: username,
            First_name: fullname,
            Last_name: "",
            Email: email,
            PASSWORD: securePassword,
            image_src:
                "https://res.cloudinary.com/ddiyrbync/image/upload/v1767618364/Squid_game_dgw9l1.jpg",
            bio: "",
        });

        return res.json({ success: true });
    } catch (err) {
        console.error("saveuser error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   UPDATE USER
========================= */
export const UpdateUser = async (req, res) => {
    try {
        const { fullname, username, email, bio } = req.body;
        const { Id } = req.user;

        const existing = await db
            .select({ id: users.Id })
            .from(users)
            .where(and(eq(users.Username, username), not(eq(users.Id, Id))))
            .limit(1);

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "Username already exists",
            });
        }

        const updateData = {
            First_name: fullname,
            Email: email,
            bio,
        };

        if (req.file) {
            updateData.image_src = req.file.path;
        }

        await db.update(users).set(updateData).where(eq(users.Id, Id));

        const [data] = await db.select().from(users).where(eq(users.Id, Id));

        return res.json({ success: true, data });
    } catch (err) {
        console.error("UpdateUser error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   LOGIN USER  (FIXED)
========================= */
export const loginuser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.Username, username), eq(users.Email, username)))
            .limit(1);

        if (!user) {
            return res.json({ success: false, message: "User not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.PASSWORD);
        if (!isMatch) {
            return res.json({ success: false, message: "Incorrect password" });
        }

        const accessToken = jwt.sign(
            { Id: user.Id, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { Id: user.Id, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 🔥 REQUIRED FOR RENDER (CROSS-SITE COOKIES)
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true });
    } catch (err) {
        console.error("loginuser error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/* =========================
   USER PROFILE
========================= */
export const userpofl = async (req, res) => {
    try {
        const { username, userId } = req.body;

        if (!username || !userId) {
            return res.status(400).json({ message: "username or userId missing" });
        }

        if (!req.user || !req.user.Id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const currentUserId = req.user.Id;

        if (Number(currentUserId) === Number(userId)) {
            return res.status(200).json({ redirect: "/api/profile" });
        }

        const [User] = await db
            .select()
            .from(users)
            .where(eq(users.Username, username))
            .limit(1);

        if (!User) {
            return res.status(404).json({ message: "User not found" });
        }

        const [currentUser] = await db
            .select({ image_src: users.image_src })
            .from(users)
            .where(eq(users.Id, currentUserId))
            .limit(1);

        const userPost = await db
            .select({ Id: posts.Id, image_url: posts.image_url })
            .from(posts)
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.created_at));

        const isfollowing = await db
            .select({ Id: followRequests.Id })
            .from(followRequests)
            .where(
                and(
                    eq(followRequests.userId, currentUserId),
                    eq(followRequests.requestId, userId)
                )
            )
            .limit(1);

        const requestUser = await RequestUser(userId);
        const follower = await Follower(userId);
        const following = await Following(userId);
        const suggsionId = await SuggsionId(currentUserId);

        return res.status(200).json({
            data: User,
            userPost,
            currentUser,
            suggsionId,
            following,
            follower,
            isfollowing: isfollowing.length > 0,
            requestUser,
        });
    } catch (error) {
        console.error("userProfile error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};