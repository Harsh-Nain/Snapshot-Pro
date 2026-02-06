import { db } from "../db/index.js";
import { followRequests, users } from "../db/schems.js";
import { eq, and } from "drizzle-orm";
import { SuggsionId, Following, Follower } from "../config/funstions.js"

export const Follow = async (req, res) => {
    const { requestId } = req.body;
    const { Id } = req.user;

    const existing = await db
        .select({ Id: followRequests.Id })
        .from(followRequests)
        .where(
            and(
                eq(followRequests.userId, requestId),
                eq(followRequests.requestId, Id)
            )
        )
        .limit(1);

    if (existing.length === 0) {
        await db.insert(followRequests).values({
            userId: requestId,
            requestId: Id,
            request: false,
        });
    }

    const [user] = await db
        .select({
            Id: users.Id,
            username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src,
        })
        .from(users)
        .where(eq(users.Id, requestId))
        .limit(1);

    return res.json({ success: true, data: user });
};

export const unFollow = async (req, res) => {
    const { requestId } = req.body;
    const { Id } = req.user;

    await db
        .delete(followRequests)
        .where(
            and(
                eq(followRequests.userId, requestId),
                eq(followRequests.requestId, Id)
            )
        );

    return res.json({ success: true });
};

export const Confirm = async (req, res) => {
    const { requestId } = req.body;
    const { Id } = req.user;

    await db
        .update(followRequests)
        .set({ request: true })
        .where(
            and(
                eq(followRequests.userId, Id),
                eq(followRequests.requestId, requestId)
            )
        );

    return res.json({ success: true });
};

export const Decline = async (req, res) => {
    const { requestId } = req.body;
    const { Id } = req.user;

    await db
        .delete(followRequests)
        .where(
            and(
                eq(followRequests.userId, Id),
                eq(followRequests.requestId, requestId)
            )
        );

    return res.json({ success: true });
};

export const Remove = async (req, res) => {
    const { requestId } = req.body;
    const { Id } = req.user;

    await db
        .delete(followRequests)
        .where(
            and(
                eq(followRequests.userId, Id),
                eq(followRequests.requestId, requestId)
            )
        );

    return res.json({ success: true });
};

export const GetFoloData = async (req, res) => {
    const { Id, which } = req.body
    let data
    if (which == "following") {
        data = await Following(Id)
    } else if (which == "followers") {
        data = await Follower(Id)
    }

    let suggession = await SuggsionId(req.user.Id)

    res.json({ Success: true, data, suggession })
}