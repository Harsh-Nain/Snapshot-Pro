import express from "express"
import { islogin } from "../middleware/islogin.js"
import { saveuser, loginuser, userpofl, UpdateUser } from "../controllers/auth.controllers.js"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloud.js";
import multer from "multer"

const router = express.Router()
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: "some-folder-name",
            format: "png",
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
        };
    },
});


const upload = multer({ storage });

router.post('/login', loginuser)
router.post('/signup', saveuser)
router.post('/updateUser', upload.single("image"), islogin, UpdateUser)
router.get('/userProfile', islogin, userpofl)

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/register', (req, res) => {
    res.render('signup')
})

export default router