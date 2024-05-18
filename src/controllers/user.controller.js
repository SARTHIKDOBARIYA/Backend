import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
    const existedUser = User.findOne({
        $or : [{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"User With email or username already exists")
    }
    
    // check for images and avatar

    const avatarLocalpath=req.files?.avatar[0]?.path;
    const coverImageLocalpath=req.files?.coverImage[0]?.path;

    if(!avatarLocalpath){
        throw new ApiError(400,"avatar file is required")
    }

    //upload the cloudinary , avatar
    
    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage=await uploadOnCloudinary(coverImageLocalpath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // create user object - create entry in DB

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    // remove password and refreshtoken field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    //check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while register User")
    }

     //return response

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User Register Successfully")
    )
    // remove password and refreshtoken field from response

})

export {registerUser}