const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asynchandler.js");
const Otp = require("../models/otp.models.js");
const User = require("../models/user.models.js")

const verifyOtp = asyncHandler( async(req,_,next)=>{
    console.log(req.body);
    const { userId, otp1,otp2,otp3,otp4,otp5,otp6 } = req.body
    console.log(userId);
    const otp = otp1+otp2+otp3+otp4+otp5+otp6;
    console.log(otp);

    const userOtp = await Otp.findOne({userid:userId});

    if(!userOtp){
        throw new ApiError(400,"Invalid");
    }

    console.log("This is the otp model of the user", userOtp);

    if(!(otp == userOtp.otp)){
        throw new ApiError(400, "Otp entered is not correct");
    }

    const updateUser = await User.updateOne({_id:userId},{$set: {isVerified: true}})
    if(!updateUser){
        throw new ApiError(500,"Updating userdetails failed")
    }
    req.user = userId
    next();
});

module.exports = verifyOtp;