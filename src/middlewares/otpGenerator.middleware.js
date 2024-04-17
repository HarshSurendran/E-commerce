const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asynchandler");
const Otp = require("../models/otp.models");
const User = require("../models/user.models");

const speakeasy = require("speakeasy");

const generateOtp = ()=>{
    const secret = speakeasy.generateSecret({ length: 20 });
    let otp
    do{
         otp = speakeasy.totp({
            secret: secret.base32,
            encoding: "base32",
        })
    } while (otp.startsWith('0'));    
    console.log(otp)
    return otp
}

const otpGenerator = asyncHandler( async(req , _, next)=>{  
    //if its coming from resend otp
    if(req.body.userid){
        const user = await User.findOne({_id:req.body.userid}).select("-password -refreshToken");
        if(!user){
            return res
            .status(400)
            .json( new ApiError(400,"Registration timed out"))
        }
        console.log("this is pure", req.body.userid) 
        const deleteOtp = await Otp.deleteMany({userid: req.body.userid});
    }   
 
    const generatedOtp = await generateOtp();

    if(!generatedOtp){
        throw new ApiError(500,"Otp generation failed");
    }
    
    const userid = req?.user?._id;

    const otp = await Otp.create({
        userid : userid ?? req.body.userid,
        otp: generatedOtp
    });

    if(!otp){
        throw new ApiError(500, "problem in saving otp to db");
    }

    req.otp = otp
    console.log("Otp saved to db", req.otp);

    next();
});

module.exports = otpGenerator;