import { RequestUser, SuggsionId, Follower, Following } from "../config/funstions.js"

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { db } from "../db/index.js";
import { users, posts, followRequests } from "../db/schems.js";
import { eq, and, or, desc, not } from "drizzle-orm";

export const saveuser = async (req, res) => {
    const { fullname, username, password, email } = req.body;

    const existingUser = await db.select().from(users).where(or(eq(users.Username, username), eq(users.Email, email)));

    if (existingUser.length > 0) {
        return res.json({
            success: false,
            message: "username already exist",
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

    res.json({
        success: true,
        redirect: "/auth/login",
    });

};

export const UpdateUser = async (req, res) => {
    const { fullname, username, email, bio } = req.body;
    const { Id } = req.user;

    const existing = await db
        .select({ id: users.Id })
        .from(users)
        .where(
            and(
                eq(users.Username, username),
                not(eq(users.Id, Id))
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return res.json({
            success: false,
            message: "Username already exists",
        });
    }

    const updateData = {
        firstName: fullname,
        email,
        bio,
    };

    if (req.file) {
        updateData.image_src = req.file.path;
    }

    await db
        .update(users)
        .set(updateData)
        .where(eq(users.Id, Id));

    return res.json({
        success: true,
        message: "Profile updated successfully",
    });
};

export const loginuser = async (req, res) => {
    const { username, password } = req.body;

    const [user] = await db.select().from(users).where(or(eq(users.Username, username),
        eq(users.Email, username))).limit(1);

    if (!user) {
        return res.json({
            success: false,
            message: "User not exist",
        });
    }

    const isMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isMatch) {
        return res.json({
            success: false,
            message: "Incorrect Password...",
        });
    }

    const accessToken = jwt.sign(
        { username: user.Username, Id: user.Id },
        "iuytrewqdsf",
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { username: user.Username, Id: user.Id },
        "iuytrewqdsf",
        { expiresIn: "7d" }
    );

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, redirect: "/" });
};

export const userpofl = async (req, res) => {
    const { username, Id } = req.query;
    const currentUserId = req.user.Id;

    if (currentUserId == Id) {
        return res.redirect('/profile')
    }

    const [User] = await db
        .select()
        .from(users)
        .where(eq(users.Username, username))
        .limit(1);

    const [currentUser] = await db
        .select({
            image_src: users.image_src,
        })
        .from(users)
        .where(eq(users.Id, currentUserId))
        .limit(1);

    const request = await db
        .select({ Id: followRequests.Id })
        .from(followRequests)
        .where(
            and(
                eq(followRequests.userId, Number(Id)),
                eq(followRequests.requestId, currentUserId)
            )
        )
        .limit(1);

    const folingBfor = request.length > 0 && Number(Id) !== currentUserId;

    const userPost = await db
        .select({
            Id: posts.Id,
            image_url: posts.image_url,
        })
        .from(posts)
        .where(eq(posts.userId, Id))
        .orderBy(desc(posts.created_at));

    const requestUser = await RequestUser(Id);
    const follower = await Follower(Id);
    const following = await Following(Id);
    const suggsionId = await SuggsionId(currentUserId);

    res.render("otherUser", { data: User, userPost, currentUser, suggsionId, following, follower, folingBfor, requestUser });
};
