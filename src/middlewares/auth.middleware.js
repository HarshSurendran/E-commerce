const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const User = require("../models/user.models");
const admin = require("../models/admin.models.js");

const verifyUserJWT = async(req,_,next)=>{
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
        
        console.log(user);
        // giving the user_id to the request property
        req.user = user;
        next();       
        
    } catch (error) {
        throw new ApiError(401,"Verification of JWT unsuccessful.")
    }
}


const verifyAdminJWT = async(req,_,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401,"Unauthorised request");
        }

        // decoding the token and verifying it with user
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const admin = await Admin.findOne({_id: decodedtoken._id}).select("-password -refreshToken");

        if(!admin){
            throw new ApiError(401,"Invalid access token");
        }

        // giving the user_id to the request property
        req.admin = admin._id;
        next();       
        
    } catch (error) {
        throw new ApiError(401,"Verification of JWT unsuccessful.")
    }
}


module.exports = {
    verifyUserJWT,
    verifyAdminJWT
};