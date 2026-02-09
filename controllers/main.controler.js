import { db } from "../db/index.js"
import { RequestUser, SuggsionId, Following, Follower } from "../config/funstions.js"
import { getPosts } from "../controllers/post.controlar.js"
import { users, posts, postLikes } from "../db/schems.js";

import { eq, or, inArray, desc, and } from "drizzle-orm";

export const dashbord = async (req, res) => {
    const { username, Id } = req.user;

    const [User] = await db.select().from(users).where(or(eq(users.Username, username),
        eq(users.Email, username))).limit(1);

    const userPost = await db.selectDistinct().from(posts).where(eq(posts.userId, Id));

    const requestUser = await RequestUser(Id);
    const suggsionId = await SuggsionId(Id);
    const postsFeed = await getPosts(req, res);

    res.json({ post: postsFeed, data: User, userPost, requestUser, suggsionId, });
};

export const searchUser = async (req, res) => {
    try {
        const q = req.query.q;

        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const result = await db
            .select({
                Id: users.Id,
                Username: users.Username,
                First_name: users.First_name,
                image_src: users.image_src
            })
            .from(users)
            .where(
                or(
                    like(users.Username, `%${q}%`),
                    like(users.First_name, `%${q}%`)
                )
            )
            .limit(10);

        res.json(result);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const profile = async (req, res) => {
    const { username, Id } = req.user;

    const [User] = await db.select().from(users).where(or(eq(users.Username, username),
        eq(users.Email, username))).orderBy(desc(users.Id)).limit(1);

    const userPost = await db
        .select({
            Id: posts.Id,
            image_url: posts.image_url,
        }).from(posts).where(eq(posts.userId, Id)).orderBy(desc(posts.created_at));

    const postIds = userPost.map(p => p.Id);

    let likedSet = new Set();
    if (postIds.length > 0) {
        const likedPosts = await db
            .select({ postId: postLikes.postId })
            .from(postLikes)
            .where(
                and(
                    eq(postLikes.userId, Id),
                    inArray(postLikes.postId, postIds)
                )
            );

        likedSet = new Set(likedPosts.map(l => l.postId));
    }

    const postsWithLike = userPost.map(post => ({
        ...post,
        isLike: likedSet.has(post.Id),
    }));

    const follower = await Follower(Id);
    const following = await Following(Id);
    const requestUser = await RequestUser(Id);
    const suggsionId = await SuggsionId(Id);

    res.json({ data: User, userPost: postsWithLike, following, follower, requestUser, suggsionId });
};

export const logout = (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ redirect: '/api/auth/login' });
};