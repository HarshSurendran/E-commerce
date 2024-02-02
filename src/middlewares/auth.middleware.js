const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const User = require("../models/user.models");
const Admin = require("../models/admin.models.js");
const asyncHandler = require("../utils/asynchandler.js");

const verifyUserJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401,"Unauthorised request");
        }

        // decoding the token and verifying it with user
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
        
        if(!user){
            throw new ApiError(401,"Invalid access token");
        }

        if(user.isBlocked){
            
            throw new ApiError(400, "The user is blocked");
        }
        
        console.log(user);
        // giving the user_id to the request property
        req.user = user;
        next();       
        
    } catch (error) {
        // throw new ApiError(401,"Verification of JWT unsuccessful.",error)        
        const options ={
            httpOnly:true,
            secure: true
        }
        
        res
        .status(400)
        .clearCookie("accessToken", options)
        .clearCookie("RefreshToken", options)
        .redirect("/api/v1");
    }
})

const verifyAdminJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "Unauthorised request");
        }

        // decoding the token and verifying it with user
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const admin = await Admin.findOne({_id: decodedtoken._id}).select("-password -refreshToken");

        if(!admin){
            throw new ApiError(401,"Invalid access token");
        }

        // giving the admin details to the request property
        req.admin = admin;
        next();       
        
    } catch (error) {
        // throw new ApiError(401,"Verification of JWT unsuccessful.",error)
        res.redirect("/api/v1/admin");
    }
})

const checkUserJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(token){
            const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const user = await User.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
            if(user){
                res.redirect("/api/v1/users/home");      
            }            
        }
        next();

    } catch(error) {
        console.log(error);
    }

});

const checkAdminJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(token){
            const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const admin = await Admin.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
            if(admin){
                res.redirect("/api/v1/admin/dashboard")            
            }
            
        }

        next();
    } catch(error) {
        console.log(error);
    }

});

const checkIsBlocked = asyncHandler( async(req,res,next)=>{
    const user = req.user;
    console.log("This is checkingi s blocked", user)
    const check = User.findOne({_id: user._id}).select("-refreshToken -createdAt -updatedAt")
    console.log("this is check.isblocked",check.isBlocked);
    if(check.isBlocked){

        const options ={
            httpOnly:true,
            secure: true
        }

        res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("RefreshToken", options)
        .redirect("/api/v1");
    }
    next();
})

module.exports = {
    verifyUserJWT,
    verifyAdminJWT,
    checkUserJWT,
    checkAdminJWT,
    checkIsBlocked
};