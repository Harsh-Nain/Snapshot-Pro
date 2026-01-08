import express from "express"
import { users } from "../db/schems.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { islogin } from "../middleware/islogin.js"
import { Message, SaveMessage, ShowMessage, addMessUSR } from "../controllers/message.controllers.js"
import { RequestUser, SuggsionId } from "../config/funstions.js"
const router = express.Router()

router.get('/message', islogin, async (req, res) => {
    const { Id } = req.user;
    const { toMessId } = req.query;
    if (toMessId) await addMessUSR(toMessId, Id);

    const [user] = await db.select({ image_src: users.image_src, Username: users.Username }).from(users).where(eq(users.Id, Id))

    const requestUser = await RequestUser(Id);
    const suggsionId = await SuggsionId(Id);

    res.render('message', {
        Id, suggsionId, requestUser, user
    });
});

router.get('/userlist', islogin, async (req, res) => {
    const { Id } = req.user;
    const message = await Message(Id);
    res.json({ message });
});

router.post('/saveMessage', islogin, SaveMessage)
router.post('/showMessage', islogin, ShowMessage)

export default router