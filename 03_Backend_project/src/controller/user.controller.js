import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { ObjectId } from "mongodb";


    const generateAccessAndRefrshTokens = async(userId) => {
        try {
            const user = await User.findById(userId);
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false })

            return {accessToken, refreshToken}
        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating referesh and access token")
        }
    }

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: by username, email
    // check for images, check for avatar
    // upload them to cloudinarym avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username, email, fullName, password} = req.body;
    console.log(`Email: ${email}`);

    // simple way to validate field
    // if(fullName === "") {
    //     throw new ApiError(400, "full name is required!")
    // }

    // advance way to validate all fields

    if(
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required!")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(existedUser)

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImgLocalPath = req.files?.coverImage[0]?.path;
    

    let coverImgLocalPath;
    

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage) {
        coverImgLocalPath = req.files.coverImage[0].path;
    }
    // debugging purpose console.log to check if file is temporary uploaded to server
    // console.log(`avatar: ${avatarLocalPath}`) 
    // console.log(`cover: ${coverImgLocalPath}`)

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImgLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // won't give encrypted password and refreshToken
    );

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong by registering a user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // username or email
    // find user 
    // check password
    // access and refresh token
    // send cookie

    const {username, email, password } = req.body;
    // console.log(`Email: ${email} || username: ${username} || password: ${password}`)

    if(!(username || email)) {
        throw new ApiError(400, "username or email is required!")
    }
    if(!password) {
        throw new ApiError(400, "password is required!")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefrshTokens(user._id);

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

const refreshAccessToken = asyncHandler( async( req, res ) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    console.log(incomingRefreshToken)

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request for refresh token line 198")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or invalid")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefrshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, RefreshToken: refreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async( req, res ) => {
    const {oldPassowrd, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassowrd)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler( async( req, res ) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler( async( req, res ) => {
    const {fullName, email} = req.body;

    if(!(fullName || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler( async( req, res ) => {
    const avatarLocalPath = req.file?.path;
    const { avatar } = req.user;
    

    if(!avatarLocalPath) {
        throw new ApiError(400, "Missing Avatar file")
    }

    let avatarPublicId = null;
    if (avatar && typeof avatar === 'string' && avatar.includes('/')) {
        try {
            avatarPublicId = avatar.split('/').pop().split('.')[0];
        } catch (error) {
            console.warn("Failed to extract public ID from avatar URL:", avatar);
        }
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if(!newAvatar.url) {
        throw new ApiError(500, "Error while uploading on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        { new: true }
    ).select("-password")

    // Clean up old avatar from cloudinary 
    deleteOnCloudinary(avatarPublicId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler( async( req, res ) => {
    const coverImageLocalPath = req.file?.path;
    const { coverImage } = req.user;

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Missing cover image file")
    }

    let coverImgPublicId = null;
    if (coverImage && typeof coverImage === 'string' && coverImage.includes('/')) {
        try {
            coverImgPublicId = coverImage.split('/').pop().split('.')[0];
        } catch (error) {
            console.warn("Failed to extract public ID from avatar URL:", coverImage);
        }
    }

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!newCoverImage.url) {
        throw new ApiError(500, "Error while uploading on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: newCoverImage.url
            }
        },
        { new: true }
    ).select("-password")

    // Clean up old avatar from cloudinary
    deleteOnCloudinary(coverImgPublicId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler( async( req, res ) => {
    const { username } = req.params;

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler( async( req, res ) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // old and probably deprecated
                // _id: new ObjectId(req.user._id) // modern + future proof
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, 
            user[0].watchHistory,
        "Watch history fetched successfully")
    )
})

export { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}