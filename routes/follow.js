import express from "express"
import { islogin } from "../middleware/islogin.js"
import { Follow, Confirm, Decline, Remove, unFollow, GetFoloData } from "../controllers/follow.controlres.js"

const router = express.Router()

router.post('/request', islogin, Follow)
router.post('/unfollow', islogin, unFollow)
router.post('/confirm', islogin, Confirm)
router.post('/decline', islogin, Decline)
router.post('/remove', islogin, Remove)

router.post("/getfollowData", islogin, GetFoloData);

export default router