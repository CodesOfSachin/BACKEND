import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!(title && description)) {
        throw new ApiError(400, "Title and description is required")
    }
    
    // TODO: get video, upload to cloudinary, create video
    let videoLocalPath;
    let thumbnailLocalPath;

    if(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile) {
        videoLocalPath = req.files.videoFile[0].path;
    }

    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if(!(videoLocalPath && thumbnailLocalPath)) {
        throw new ApiError(400, "Video & thumbnail is required")
    }

    const videoCloud = await uploadOnCloudinary(videoLocalPath);
    const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(videoCloud)
    console.log(thumbnailCloud)

    if(!(videoCloud || thumbnailCloud)) {
        throw new ApiError(500, "something went wrong while uploading on cloudinary")
    }

    const video = await Video.create({
        videoFile: videoCloud.url,
        thumbnail: thumbnailCloud.url,
        owner: req.user._id,
        title: title,
        description: description,
        duration: videoCloud.duration
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video ,"Video Uploaded")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
