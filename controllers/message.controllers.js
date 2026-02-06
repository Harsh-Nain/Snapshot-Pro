import { db } from "../db/index.js";
import { messages, users } from "../db/schems.js";
import { eq, or, and, desc, asc, sql } from "drizzle-orm";

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
            file: messages.url,
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
        .orderBy(desc(messages.created_at));

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
        message: message?.trim() || '',
        url: files.length ? files : ''
    });

    res.json({
        success: true,
        data: {
            senderId: Number(Id),
            message: message?.trim() || '',
            files: files || '',
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
        .orderBy(
            asc(messages.created_at),
            asc(messages.Id)
        );

    const updatedData = data.map(msg => ({
        ...msg,
        fromMe: msg.senderId === Id
    }));

    res.json({ success: true, data: updatedData });
};

export const addNewUSR = async (toMessId, Id) => {
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

export const UnSend = async (req, res) => {
    const messId = req.query.messid;
    console.log(messId);

    await db
        .delete(messages)
        .where(
            and(
                eq(messages.Id, messId),
                eq(messages.senderId, req.user.Id)
            )
        );

    res.json({ success: true });
};









// import { db } from "../db/index.js";
// import { messages, users } from "../db/schems.js";
// import { inArray } from "drizzle-orm";
// import { connectDB } from "../mongodb/mdb.js"
// import { ObjectId } from "mongodb";

// export const Message = async (Id) => {
//     const Mdb = await connectDB();
//     const userId = Number(Id); const lastMessages = await Mdb.collection("messages").aggregate([
//         {
//             $match: {
//                 $or: [
//                     { reciverId: userId },
//                     { senderId: userId }
//                 ]
//             }
//         },
//         {
//             $addFields: {
//                 otherUserId: {
//                     $cond: [
//                         { $eq: ["$senderId", userId] },
//                         "$reciverId",
//                         "$senderId"
//                     ]
//                 }
//             }
//         },
//         { $sort: { created_at: -1 } },
//         {
//             $group: {
//                 _id: "$otherUserId",
//                 message: { $first: "$message" },
//                 file: { $first: "$url" },
//                 created_at: { $first: "$created_at" }
//             }
//         },
//         { $sort: { created_at: -1 } }
//     ]).toArray();

//     const userIds = lastMessages.map(m => m._id);

//     const usersData = await db
//         .select({
//             Id: users.Id,
//             Username: users.Username,
//             First_name: users.First_name,
//             image_src: users.image_src
//         })
//         .from(users)
//         .where(inArray(users.Id, userIds));

//     const userMap = new Map(usersData.map(u => [u.Id, u]));

//     const mergedData = lastMessages.map(msg => {
//         const user = userMap.get(msg._id);

//         return {
//             Id: user?.Id,
//             Username: user?.Username,
//             First_name: user?.First_name,
//             image_src: user?.image_src,
//             lastMessage: msg.message,
//             file: msg.file,
//             created_at: msg.created_at
//         };
//     });

//     return mergedData;

// };

// export const SaveMessage = async (req, res) => {
//     const Mdb = await connectDB();
//     const { Id } = req.user;
//     const { message, reciverId } = req.body;

//     const uploadedFiles = req.files || [];

//     const files = uploadedFiles.map(file => ({
//         url: file.path,
//         type: file.mimetype.split("/")[0],
//         name: file.originalname
//     }));

//     await Mdb.collection("messages").insertOne({
//         senderId: Number(Id),
//         reciverId: Number(reciverId),
//         message: message?.trim() || '',
//         url: files.length ? files : '',
//         created_at: new Date(),
//         seen: false
//     });

//     await db.insert(messages).values({
//         senderId: Number(Id),
//         receiverId: Number(reciverId),
//         message: message?.trim() || '',
//         url: files.length ? files : ''
//     });

//     res.json({
//         success: true,
//         data: {
//             senderId: Number(Id),
//             message: message?.trim() || '',
//             files: files || '',
//             created_at: new Date()
//         }
//     });
// };

// export const ShowMessage = async (req, res) => {
//     const Mdb = await connectDB();
//     const { Id } = req.user;
//     const otherUserId = Number(req.query.Id);

//     const data = await Mdb.collection("messages")
//         .find({
//             $or: [
//                 { senderId: Id, reciverId: otherUserId },
//                 { senderId: otherUserId, reciverId: Id }
//             ]
//         })
//         .sort({ createdAt: 1 })
//         .toArray();

//     res.json({ success: true, data });
// };

// export const addNewUSR = async (toMessId, Id) => {
//     const Mdb = await connectDB();
//     const receiverId = Number(toMessId);
//     const senderId = Number(Id);


//     const ExistBefor = await Mdb.collection("messages")
//         .find({
//             $or: [
//                 { senderId: senderId, reciverId: receiverId },
//                 { senderId: receiverId, reciverId: senderId }
//             ]
//         })
//         .toArray();

//     if (ExistBefor.length === 0) {
//         await db.insert(messages).values({
//             senderId,
//             receiverId,
//             message: "Hello"
//         });
//     }

//     return true;
// };

// export const UnSend = async (req, res) => {
//     const Mdb = await connectDB();
//     const messId = req.query.messid;
//     console.log(messId);

//     await Mdb
//         .collection("messages")
//         .deleteOne({ _id: new ObjectId(messId) });

//     res.json({ success: true });
// };