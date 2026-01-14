import express from "express"
import multer from "multer"
import { islogin } from "../middleware/islogin.js"
import { RequestUser, SuggsionId } from "../config/funstions.js"
import { postData } from "../controllers/post.controlar.js"
import { editPost, edit, deletePost, postLike, postComment, addComment, getPosts, OnePost } from "../controllers/post.controlar.js"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloud.js";

const router = express.Router()

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder = "posts/images";
        let resource_type = "image";

        if (file.mimetype.startsWith("audio")) {
            folder = "posts/audio";
            resource_type = "video";
        }

        return {
            folder,
            resource_type,
            public_id: `${Date.now()}-${file.originalname.split(".")[0]}`
        };
    }
});

router.get('/post', islogin, async (req, res) => {
    const { Id } = req.user
    let requestUser = await RequestUser(Id)
    let suggsionId = await SuggsionId(Id)
    res.render('post', { requestUser, suggsionId })
})

router.get("/posts", islogin, async (req, res) => {
    let posts = await getPosts(req, res)
    res.json(posts)
});

const upload = multer({ storage });
router.get('/onePost', islogin, OnePost)
router.post('/post', islogin, upload.fields([{ name: "post", maxCount: 1 }, { name: "song", maxCount: 1 }]), postData);
router.post('/like', islogin, postLike)
router.post('/delete', islogin, deletePost)
router.post('/editPost', islogin, upload.fields([{ name: "post", maxCount: 1 }, { name: "song", maxCount: 1 }]), editPost)
router.post('/edit', islogin, edit)
router.get('/postcomment', islogin, postComment)
router.post('/addcomment', islogin, addComment)

export default router