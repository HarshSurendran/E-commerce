const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const Admin = require("../models/admin.models.js");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = async (adminid)=>{
    try{
    const admin = await Admin.findOne({_id:adminid});    
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();    
    
    admin.refreshToken = refreshToken;
    admin.save({ validateBeforeSave:false });
    
    return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while creating Tokens")
    }
}

const adminlogin = asyncHandler( async(req,res)=>{
    const {email, password} = req.body;

    //validation
    if(email.trim()=="" || password.trim()==""){
        throw new ApiError(400,"Email and password is compulsory");
    }

    const admin = await Admin.findOne({email});

    if(!admin){
        throw new ApiError(400,"Invalid email id");
    }
    //checking password
    const isPasswordCorrect = await admin.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorrect Credentials");
    }

    //generate tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(admin._id);

    console.log(accessToken,"new redresh token", refreshToken);

    const adminLoggedIn = Admin.findOne({_id:admin._id}).select("-password -refreshToken")
    
    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json( new ApiResponse(
        200,
        {},
        "Admin logged in successfully"
    ));
});

module.exports = {
    adminlogin
}