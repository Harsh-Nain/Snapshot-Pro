import { db } from "../db/index.js";
import { users, posts, postLikes, followRequests } from "../db/schems.js";
import { eq, and, not, inArray, } from "drizzle-orm";

export const RequestUser = async (Id) => {
    return await db
        .select({
            Id: users.Id,
            Username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src,
        })
        .from(followRequests)
        .innerJoin(users, eq(users.Id, followRequests.requestId))
        .where(
            and(
                eq(followRequests.userId, Id),
                eq(followRequests.request, false)
            )
        );
};

export const SuggsionId = async (Id) => {
    const subQuery = db
        .select({ userId: followRequests.userId })
        .from(followRequests)
        .where(eq(followRequests.requestId, Id));

    return await db
        .select({
            Id: users.Id,
            First_name: users.First_name,
            Username: users.Username,
            image_src: users.image_src,
        })
        .from(users)
        .where(
            and(
                not(eq(users.Id, Id)),
                not(inArray(users.Id, subQuery))
            )
        );
};

export const Follower = async (Id) => {
    return await db
        .select({
            Id: users.Id,
            Username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src,
        })
        .from(followRequests)
        .innerJoin(users, eq(users.Id, followRequests.userId))
        .where(eq(followRequests.requestId, Id));
};

export const Following = async (Id) => {
    return await db
        .select({
            Id: users.Id,
            Username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src,
        })
        .from(followRequests)
        .innerJoin(users, eq(users.Id, followRequests.requestId))
        .where(eq(followRequests.userId, Id));
};

export const UserPost = async (Id) => {
    const userPost = await db
        .select()
        .from(posts)
        .where(
            and(
                eq(posts.userId, Id),
                eq(posts.isPublic, false)
            )
        );

    if (userPost.length === 0) return [];

    const postIds = userPost.map(p => p.Id);

    const likes = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(
            and(
                eq(postLikes.userId, Id),
                inArray(postLikes.postId, postIds)
            )
        );

    const likedSet = new Set(likes.map(l => l.postId));

    return userPost.map(post => ({
        ...post,
        isLike: likedSet.has(post.Id),
    }));
}
