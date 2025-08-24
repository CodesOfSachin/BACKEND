import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(existedUser)

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImgLocalPath = req.files?.avatar[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImg = await uploadOnCloudinary(coverImgLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImg: coverImg?.url || "",
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

export { registerUser }