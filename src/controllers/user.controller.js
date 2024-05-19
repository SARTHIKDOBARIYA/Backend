import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessTokens()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({ValidateBeforeSave:false})

        return {AccessToken,refreshToken}

    }
    catch(err){
        throw new ApiError(500,"Something went wrong while generating and refreshing Token ")
    }
}

const registerUser=asyncHandler(async (req,res)=>{

    // get user detail from frontend
    const {fullName,email,username,password}=req.body;
    
    //validation - not empty
    if (fullName===""){
        throw new ApiError(400,"Full name is required")
    }
    if(email===""){
        throw new ApiError(400,"Email is required")
    }
    if(username===""){
        throw new ApiError(400,"username is required")
    }
    if(password===""){
        throw new ApiError(400,"Password is required")
    }

        //instead of this
        // if([fullName,email,username,password].some((field)=>field?.trim() === "")){
        //     throw new ApiError(400,"All field are requires")
        // }
    

    //check if user already exist: username and email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser=asyncHandler(async (req,res)=>{

    //reqbody->data

    const {email,username,password}=req.body;
    
    //username,email
    if(!(username || email)){
        throw new ApiError(400,"Username or Password is required")
    }
    // find the user

    const user= await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist")
    }
    
    
    //check password

    const ispasswordValid = await user.isPasswordCorrect(password)

    if(!ispasswordValid){
        throw new ApiError(400,"Invalid User Credential")
    }

    //Access and refresh token
    
    const {AccessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser= await User.findById(user._id)
    .select("-password -refreshToken")

    //send cookie

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",AccessToken,options)
    .cookie("refreshtoken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,AccessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {   
            $set:{
                refreshToken:undefined
            }
        },
        {
            new : true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshtoken",options)
    .json(
        new ApiResponse(200,{},"User logged Out")
    )
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingrefeshToken = req.cookie.refreshToken || req.body.refreshToken

    if(incomingrefeshToken){
        throw new ApiError(401,"unauthoroze Token")
    }

    try {
        const decodedToken = jwt.verify(
            incomingrefeshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser
}