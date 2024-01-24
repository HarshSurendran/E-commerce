const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asynchandler");
const Otp = require("../models/otp.models");

const verifyOtp = asyncHandler( async(req,_,next)=>{
    console.log(req.body);
    const { userId, otp } = req.body
    console.log(userId);

    const userOtp = await Otp.findOne({userid:userId});

    if(!userOtp){
        throw new ApiError(400,"there is no user with this Id")
    }

    console.log("This is the otp model of the user", userOtp);

    if(!(otp == userOtp.otp)){
        throw new ApiError(400, "Otp entered is not correct");
    }

    req.user = userId
    next();
});

module.exports = verifyOtp;