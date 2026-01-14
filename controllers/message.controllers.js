import { db } from "../db/index.js";
import { messages, users } from "../db/schems.js";
import { eq, or, and, asc, sql } from "drizzle-orm";

export const Message = async (Id) => {
    const userId = Number(Id);

    const lastMessageSub = db
        .select({
            otherUserId: sql`
        CASE
          WHEN ${messages.senderId} = ${userId}
          THEN ${messages.receiverId}
          ELSE ${messages.senderId}
        END
      `.as("otherUserId"),

            lastAt: sql`MAX(${messages.created_at})`.as("lastAt"),
        })
        .from(messages)
        .where(
            or(
                eq(messages.senderId, userId),
                eq(messages.receiverId, userId)
            )
        )
        .groupBy(sql`otherUserId`)
        .as("lm");

    const data = await db
        .select({
            Id: users.Id,
            Username: users.Username,
            image_src: users.image_src,
            First_name: users.First_name,
            lastMessage: messages.message,
            created_at: messages.created_at,
        })
        .from(messages)
        .innerJoin(
            lastMessageSub,
            sql`
        lm.otherUserId =
          CASE
            WHEN ${messages.senderId} = ${userId}
            THEN ${messages.receiverId}
            ELSE ${messages.senderId}
          END
        AND lm.lastAt = ${messages.created_at}
      `
        )
        .innerJoin(
            users,
            eq(users.Id, sql`lm.otherUserId`)
        )
        .orderBy(asc(messages.created_at));

    return data;
};

export const SaveMessage = async (req, res) => {
    const { Id } = req.user;
    const { message, reciverId } = req.body;

    const uploadedFiles = req.files || [];

    const files = uploadedFiles.map(file => ({
        url: file.path,
        type: file.mimetype.split("/")[0],
        name: file.originalname
    }));

    await db.insert(messages).values({
        senderId: Number(Id),
        receiverId: Number(reciverId),
        message: message?.trim() || null,
        url: files.length ? files : null
    });

    res.json({
        success: true,
        data: {
            senderId: Number(Id),
            message: message?.trim() || null,
            files,
            created_at: new Date()
        }
    });
};

export const ShowMessage = async (req, res) => {
    const { Id } = req.user;
    const otherUserId = Number(req.query.Id);

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