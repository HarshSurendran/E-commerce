const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asynchandler");
const Otp = require("../models/otp.models")

const speakeasy = require("speakeasy");

const generateOtp = ()=>{

    const secret = speakeasy.generateSecret({ length: 20 });

    console.log("\n you have entered otp generator function and this is the secret :",secret);

    const otp = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
    })

    console.log(otp);

    return otp
}

const otpGenerator = asyncHandler( async(req , _, next)=>{
    console.log(req.user._id);    
 
    const generatedOtp = await generateOtp();

    if(!generatedOtp){
        throw new ApiError(500,"Otp generation failed");
    }

    const otp = await Otp.create({
        userid: req.user._id,
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