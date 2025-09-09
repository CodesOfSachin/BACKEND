import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { publishAVideo } from "../controller/video.controller.js";


import { upload } from "../middlewares/multer.middleware.js";


const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/upload-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

export default router;