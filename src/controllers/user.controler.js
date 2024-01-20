const asyncHandler = require("../utils/asynchandler.js")
const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.models.js")
const uploadOnCloudinary = require("../utils/cloudinary.js");
const ApiResponse = require("../utils/ApiResponse.js");

const registerUser = asyncHandler(async(req,res)=>{
   // user email unique validation - done
   // take file from user -done
   // upload image to cloudinary -done
   // upload data to database
   const {fullname,phone,email,password} = req.body;
    console.log(fullname);
    if(fullname.trim() === ""){
        throw new ApiError(400, "fullname is required")
    }else if(email.trim() === ""){
        throw new ApiError(400, "email is required")
    }else if(password.trim() === ""){
        throw new ApiError(400, "password is required")
    }
    let nameRegex = /^[A-Z]/
    if(!fname.match(nameRegex)){
        throw new ApiError(400, "First name has to start with a capital letter")     
    }
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/       
    if(!email.match(emailRegex)){
        throw new ApiError(400, "Email is not valid")
    }


    const emailExist = await User.findOne({email})
    console.log("Details of existing email id", emailExist);
    if(emailExist){
        throw new ApiError(409,"Email already exists");
    }

    const imageLocalPath = req.files?.image?.path;

    const imageUploaded = await uploadOnCloudinary(imageLocalPath);

    console.log("\n the response after image uploaded", imageUploaded);

    const user = await User.create({
        fullname,
        phone,
        email,
        password,
        image: imageUploaded?.url || ""
    });

    const createdUser = await User.findbyId(user._id).select("-password -refreshtoken");

    if(!createdUser){
        throw new ApiError(500,"Error while registering a user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

module.exports = {
    registerUser
}