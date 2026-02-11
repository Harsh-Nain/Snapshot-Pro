import { db } from "../db/index.js";
import { users, posts, postLikes, postComments, } from "../db/schems.js";
import { eq, and, desc, count } from "drizzle-orm";

export const postData = async (req, res) => {
    console.log('posting........');

    let { postname, discription, isPublic } = req.body;
    const { Id } = req.user;

    isPublic = isPublic === undefined ? false : true;
    const image = req.files.post[0];

    const audio = req.files.song ? req.files.song[0] : null;

    let imagePath = image.path
    let songPath = ''

    if (audio) {
        songPath = audio.path
    }

    await db.insert(posts).values({
        userId: Id,
        postName: postname,
        desc: discription,
        image_url: imagePath,
        songUrl: songPath,
        isPublic,
    });

    res.json({ success: true, redirect: "/" });
};

export const edit = async (req, res) => {
    const { username, id } = req.body;

    const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.Id, id))
        .limit(1);

    res.json({ post, username, });
};

export const EditPost = async (req, res) => {
    let { id, postname, discription, isPublic } = req.body;
    isPublic = isPublic === undefined ? true : false;

    const updateData = {
        postName: postname,
        desc: discription,
        isPublic,
        created_at: new Date(),
    };

    if (req.files?.post?.length) {
        updateData.image_url = req.files.post[0].path;
    }

    const audio = req.files.song ? req.files.song[0] : null;

    if (audio) {
        updateData.songUrl = audio.path;
    }

    await db.update(posts).set(updateData).where(eq(posts.Id, id));

    res.json({ success: true, redirect: "/profile" });
};

export const deletePost = async (req, res) => {
    const { id } = req.body;

    await db.delete(posts).where(eq(posts.Id, id));

    res.redirect("/");
};

export const postLike = async (req, res) => {
    const { postid } = req.body;
    const userId = req.user.Id;

    const [existingLike] = await db
        .select()
        .from(postLikes)
        .where(
            and(
                eq(postLikes.userId, userId),
                eq(postLikes.postId, postid)
            )
        )
        .limit(1);

    const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.Id, postid))
        .limit(1);

    if (!post) return res.json({ success: false });

    if (existingLike) {
        await db.delete(postLikes).where(eq(postLikes.Id, existingLike.Id));

        const totalLikes = Math.max(post.Likes - 1, 0);

        await db
            .update(posts)
            .set({ Likes: totalLikes })
            .where(eq(posts.Id, postid));

        return res.json({ success: true, totalLikes, isLike: false });
    }

    await db.insert(postLikes).values({
        userId,
        postId: postid,
    });

    const totalLikes = post.Likes + 1;

    await db
        .update(posts)
        .set({ Likes: totalLikes })
        .where(eq(posts.Id, postid));

    res.json({ success: true, totalLikes, isLike: true });
};

export const postComment = async (req, res) => {
    const { postId } = req.body;

    const comments = await db
        .select({
            Id: postComments.Id,
            content: postComments.content,
            created_at: postComments.created_at,
            userId: postComments.userId,
            username: users.Username,
            image_src: users.image_src,
        })
        .from(postComments)
        .innerJoin(users, eq(users.Id, postComments.userId))
        .where(eq(postComments.postId, postId))
        .orderBy(desc(postComments.Id));

    res.json({ success: true, comments });
};

export const addComment = async (req, res) => {
    const { Comment, postId } = req.body;
    const { Id } = req.user;

    await db.insert(postComments).values({
        userId: Id,
        postId,
        content: Comment,
    });

    const [comment] = await db
        .select({
            Id: postComments.Id,
            content: postComments.content,
            created_at: postComments.created_at,
            userId: postComments.userId,
            username: users.Username,
            image_src: users.image_src,
        })
        .from(postComments)
        .innerJoin(users, eq(users.Id, postComments.userId))
        .where(eq(postComments.postId, postId))
        .orderBy(desc(postComments.Id))
        .limit(1);

    res.json({ success: true, comment });
};

export const OnePost = async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.Id;

    const [post] = await db
        .select({
            Id: posts.Id,
            image_url: posts.image_url,
            desc: posts.desc,
            totalLikes: posts.Likes,
            created_at: posts.created_at,
            username: users.Username,
            image_src: users.image_src,
            username: users.Username
        })
        .from(posts)
        .innerJoin(users, eq(users.Id, posts.userId))
        .where(eq(posts.Id, Number(postId)))
        .limit(1);

    if (!post) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }

    const liked = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(
            and(
                eq(postLikes.userId, userId),
                eq(postLikes.postId, Number(postId))
            )
        );

    post.isLike = liked.length > 0;

    res.json(post);
};

export const getPosts = async (req, res) => {
    const limit = 5;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const userId = req.user.Id;

    const postsData = await db
        .select({
            Id: posts.Id,
            image_url: posts.image_url,
            songUrl: posts.songUrl,
            desc: posts.desc,
            totalLikes: posts.Likes,
            username: users.Username,
            postName: posts.postName,
            image_src: users.image_src,
            userId: users.Id,
            commentCount: count(postComments.Id),
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.Id))
        .leftJoin(postComments, eq(postComments.postId, posts.Id))
        .where(eq(posts.isPublic, false))
        .groupBy(posts.Id, users.Id)
        .orderBy(desc(posts.created_at))
        .limit(limit)
        .offset(offset);

    if (postsData.length === 0) {
        return res.json([]);
    }

    const likedPosts = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(eq(postLikes.userId, userId));

    const likedPostIds = new Set(likedPosts.map(l => l.postId));

    const result = postsData.map(post => ({
        ...post,
        commentCount: Number(post.commentCount),
        isLike: likedPostIds.has(post.Id),
    }));

    return result
};