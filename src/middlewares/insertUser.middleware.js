const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.models.js");
const asyncHandler = require("../utils/asynchandler.js")
const uploadOnCloudinary = require("../utils/cloudinary.js");
const fs = require("fs");


const insertUser = asyncHandler( async (req, _,next)=>{   
    
    const {fullname,phone,email,password,confirmpassword} = req.body;

    // if(!req.file){
    //     throw new ApiError(500,"Image path is null");
    // }

    //const imageLocalPath = req.file?.path; 

    //validation
    // if(fullname.trim() === ""){
    //     throw new ApiError(400, "fullname is required")
    // }else if(email.trim() === ""){
    //     throw new ApiError(400, "email is required")
    // }else if(password.trim() === ""){
    //     throw new ApiError(400, "password is required")
    // }else if(confirmpassword.trim() === ""){
    //     throw new ApiError(400, "Confirm password is required")
    // }
    // let nameRegex = /^[A-Z]/
    // if(!fullname.match(nameRegex)){
    //     throw new ApiError(400, "First name has to start with a capital letter")     
    // }
    // let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/       
    // if(!email.match(emailRegex)){
    //     throw new ApiError(400, "Email is not valid")
    // }

    // const emailExist = await User.findOne({email})
    
    // if(emailExist){
    //     fs.unlinkSync(imageLocalPath);
    //     console.log("Details of existing email id", emailExist);
    //     throw new ApiError(409,"Email already exists");
    // }
    // if(!(password===confirmpassword)){
    //     throw new ApiError(400,"passwords are not matching")
    // }
    
    //file handling       

    //const imageUploaded = await uploadOnCloudinary(imageLocalPath);

    //console.log("\n the url after image uploaded", imageUploaded.url);


    //checking weather the same email or phone number exists
    
    const emailExist = await User.findOne({email}).select("-password -refreshtoken -createdAt -updatedAt");
    if(emailExist){
        throw new ApiError(400,"Email already exists");
    }
    const phoneExist = await User.findOne({phone}).select("-password -refreshtoken -createdAt -updatedAt");
    if(phoneExist){
        throw new ApiError(400,"Phone number already exists");
    }
    console.log("this is emailExist :",emailExist);


    const user = await User.create({
        fullname,
        phone,
        email,
        password,
        //image: imageUploaded?.url || ""
    });

    const createdUser = await User.findOne({_id: user._id}).select("-password -refreshtoken");

    if(!createdUser){
        throw new ApiError(500,"Error while registering a user");
    }    

    // setTimeout(async (email)=>{
    //     const user123 = await User.findOne({email});
    //     if(user123.isVerified == false){
    //         await User.deleteOne({_id:user123._id})
    //     }
    // });

    req.user = createdUser;
    next();
})

module.exports = insertUser
