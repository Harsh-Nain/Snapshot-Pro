import express from "express"
import multer from "multer"
import { users } from "../db/schems.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { islogin } from "../middleware/islogin.js"
import { Message, SaveMessage, ShowMessage, addNewUSR, UnSend, DeleteUserChat } from "../controllers/message.controllers.js"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloud.js";
const router = express.Router()

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder = "posts/others";

        if (file.mimetype.startsWith("image")) folder = "posts/images";
        else if (file.mimetype.startsWith("video")) folder = "posts/videos";
        else if (file.mimetype.startsWith("audio")) folder = "posts/audio";
        else folder = "posts/documents";
        const cleanFileName = file.originalname
            .replace(/\.[^/.]+$/, "")
            .replace(/[^\w\-]+/g, "_");

        return {
            folder,
            resource_type: "auto",
            public_id: `${Date.now()}-${cleanFileName}`,
        };
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
});

router.get('/message', islogin, async (req, res) => {
    const { Id } = req.user;
    const { toMessId } = req.query;
    if (toMessId) await addNewUSR(toMessId, Id);

    const [user] = await db.select({ image_src: users.image_src, Username: users.Username }).from(users).where(eq(users.Id, Id))
    res.json({ success: true, redirect: "/api/message/message", user, Id });
});

router.get('/userlist', islogin, async (req, res) => {
    const { Id } = req.user;
    const message = await Message(Id);
    res.json({ message });
});

router.get("/loadmess", islogin, ShowMessage);

router.post('/saveMessage', upload.array("files", 10), islogin, SaveMessage)
router.post('/showMessage', islogin, ShowMessage)
router.get('/clearchat', islogin, DeleteUserChat)
router.delete('/unSend', islogin, UnSend);

export default router