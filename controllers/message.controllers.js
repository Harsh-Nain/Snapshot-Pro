import { db } from "../db/index.js";
import { messages, users } from "../db/schems.js";
import { inArray } from "drizzle-orm";
import { connectDB } from "../mongodb/mdb.js"
import { ObjectId } from "mongodb";

export const Message = async (Id) => {
    const Mdb = await connectDB();
    const userId = Number(Id); const lastMessages = await Mdb.collection("messages").aggregate([
        {
            $match: {
                $or: [
                    { reciverId: userId },
                    { senderId: userId }
                ]
            }
        },
        {
            $addFields: {
                otherUserId: {
                    $cond: [
                        { $eq: ["$senderId", userId] },
                        "$reciverId",
                        "$senderId"
                    ]
                }
            }
        },
        { $sort: { created_at: -1 } },
        {
            $group: {
                _id: "$otherUserId",
                message: { $first: "$message" },
                file: { $first: "$url" },
                created_at: { $first: "$created_at" }
            }
        },
        { $sort: { created_at: -1 } }
    ]).toArray();

    const userIds = lastMessages.map(m => m._id);

    const usersData = await db
        .select({
            Id: users.Id,
            Username: users.Username,
            First_name: users.First_name,
            image_src: users.image_src
        })
        .from(users)
        .where(inArray(users.Id, userIds));

    const userMap = new Map(usersData.map(u => [u.Id, u]));

    const mergedData = lastMessages.map(msg => {
        const user = userMap.get(msg._id);

        return {
            Id: user?.Id,
            Username: user?.Username,
            First_name: user?.First_name,
            image_src: user?.image_src,
            lastMessage: msg.message,
            file: msg.file,
            created_at: msg.created_at
        };
    });

    return mergedData;

};

export const SaveMessage = async (req, res) => {
    const Mdb = await connectDB();
    const { Id } = req.user;
    const { message, reciverId } = req.body;

    const uploadedFiles = req.files || [];

    const files = uploadedFiles.map(file => ({
        url: file.path,
        type: file.mimetype.split("/")[0],
        name: file.originalname
    }));

    await Mdb.collection("messages").insertOne({
        senderId: Number(Id),
        reciverId: Number(reciverId),
        message: message?.trim() || '',
        url: files.length ? files : '',
        created_at: new Date(),
        seen: false
    });

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
    const Mdb = await connectDB();
    const { Id } = req.user;
    const otherUserId = Number(req.query.Id);

    const data = await Mdb.collection("messages")
        .find({
            $or: [
                { senderId: Id, reciverId: otherUserId },
                { senderId: otherUserId, reciverId: Id }
            ]
        })
        .sort({ createdAt: 1 })
        .toArray();

    res.json({ success: true, data });
};

export const addNewUSR = async (toMessId, Id) => {
    const Mdb = await connectDB();
    const receiverId = Number(toMessId);
    const senderId = Number(Id);


    const ExistBefor = await Mdb.collection("messages")
        .find({
            $or: [
                { senderId: senderId, reciverId: receiverId },
                { senderId: receiverId, reciverId: senderId }
            ]
        })
        .toArray();

    if (ExistBefor.length === 0) {
        await db.insert(messages).values({
            senderId,
            receiverId,
            message: "Hello"
        });
    }

    return true;
};

export const UnSend = async (req, res) => {
    const Mdb = await connectDB();
    const messId = req.query.messid;
    console.log(messId);

    await Mdb
        .collection("messages")
        .deleteOne({ _id: new ObjectId(messId) });

    res.json({ success: true });
};
