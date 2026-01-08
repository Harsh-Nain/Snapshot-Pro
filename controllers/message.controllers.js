import { db } from "../db/index.js";
import { messages, users } from "../db/schems.js";
import { Follower } from "../config/funstions.js";
import { eq, or, and, asc, sql } from "drizzle-orm";

export const Message = async (Id) => {
    const userId = Number(Id);

    const data = await db
        .selectDistinct({
            Id: users.Id,
            Username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src,
        })
        .from(messages)
        .innerJoin(
            users,
            eq(
                users.Id,
                sql`
          CASE
            WHEN ${messages.senderId} = ${userId}
            THEN ${messages.receiverId}
            ELSE ${messages.senderId}
          END
        `
            )
        )
        .where(
            or(
                eq(messages.senderId, userId),
                eq(messages.receiverId, userId)
            )
        )
        .orderBy(asc(users.Username));

    return data;
};

export const SaveMessage = async (req, res) => {
    const { Id } = req.user;
    const { message, reciverId } = req.body;

    await db.insert(messages).values({
        senderId: Number(Id),
        receiverId: Number(reciverId),
        message: message.trim(),
    });

    res.json({ success: true });
};

export const ShowMessage = async (req, res) => {
    const { Id } = req.user;
    const otherUserId = Number(req.query.Id);
    console.log(Id,otherUserId)

    const data = await db
        .select()
        .from(messages)
        .where(
            or(
                and(
                    eq(messages.senderId, Id),
                    eq(messages.receiverId, otherUserId)
                ),
                and(
                    eq(messages.senderId, otherUserId),
                    eq(messages.receiverId, Id)
                )
            )
        )
        .orderBy(asc(messages.created_at));

        res.json({ success: true, data });
};

export const addMessUSR = async (toMessId, Id) => {
    const receiverId = Number(toMessId);
    const senderId = Number(Id);

    const existing = await db
        .select({ Id: messages.Id })
        .from(messages)
        .where(
            and(
                or(
                    and(
                        eq(messages.senderId, senderId),
                        eq(messages.receiverId, receiverId)
                    ),
                    and(
                        eq(messages.senderId, receiverId),
                        eq(messages.receiverId, senderId)
                    )
                )
            )
        )
        .limit(1);

    if (existing.length === 0) {
        await db.insert(messages).values({
            senderId,
            receiverId,
            message: ""
        });
    }

    return true;
};