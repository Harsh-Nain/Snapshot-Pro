import express from "express"
import multer from "multer"
import { islogin } from "../middleware/islogin.js"
import { RequestUser, SuggsionId } from "../config/funstions.js"
import { postData } from "../controllers/post.controlar.js"
import { EditPost, edit, deletePost, postLike, postComment, addComment, getPosts, OnePost } from "../controllers/post.controlar.js"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloud.js";

const router = express.Router()

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder;
        let resource_type;

        if (file.mimetype.startsWith("image/")) {
            folder = "posts/images";
            resource_type = "image";
        }
        else if (file.mimetype.startsWith("audio/")) {
            folder = "posts/audio";
            resource_type = "video";
        }
        else {
            folder = "posts/documents";
            resource_type = "raw";
        }

        return { folder, resource_type, public_id: `${Date.now()}-${file.originalname.split(".")[0]}` };
    }
});

router.get('/post', islogin, async (req, res) => {
    const { Id } = req.user
    let requestUser = await RequestUser(Id)
    let suggsionId = await SuggsionId(Id)
    res.json({ requestUser, suggsionId })
})

router.get("/posts", islogin, async (req, res) => {
    let posts = await getPosts(req, res)
    res.json(posts)
});

const upload = multer({ storage });
router.post('/editPost', islogin, upload.fields([{ name: "post", maxCount: 1 }, { name: "song", maxCount: 1 }]), async (req, res) => {
    let rs = await EditPost(req, res)
    res.json(rs)
})
router.post('/onePost', islogin, OnePost)
router.post('/post', islogin, upload.fields([{ name: "post", maxCount: 1 }, { name: "song", maxCount: 1 }]), postData);
router.post('/like', islogin, postLike)
router.post('/delete', islogin, deletePost)
router.post('/edit', islogin, edit)
router.post('/postcomment', islogin, postComment)
router.post('/CreateComment', islogin, addComment)

export default router