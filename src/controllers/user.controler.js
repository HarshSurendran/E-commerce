const asyncHandler = require("../utils/asynchandler.js")
const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.models.js")
const uploadOnCloudinary = require("../utils/cloudinary.js");
const ApiResponse = require("../utils/ApiResponse.js");

const registerUser = asyncHandler(async(req,res)=>{   
   const {fullname,phone,email,password} = req.body;
    console.log(fullname);

    //validation
    if(fullname.trim() === ""){
        throw new ApiError(400, "fullname is required")
    }else if(email.trim() === ""){
        throw new ApiError(400, "email is required")
    }else if(password.trim() === ""){
        throw new ApiError(400, "password is required")
    }
    let nameRegex = /^[A-Z]/
    if(!fullname.match(nameRegex)){
        throw new ApiError(400, "First name has to start with a capital letter")     
    }
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/       
    if(!email.match(emailRegex)){
        throw new ApiError(400, "Email is not valid")
    }

    const emailExist = await User.findOne({email})
    
    if(emailExist){
        console.log("Details of existing email id", emailExist);
        throw new ApiError(409,"Email already exists");
    }
    
    //file handling
    console.log(req.file);

    if(!req.file){
        throw new ApiError(500,"Image path is null");
    }

    const imageLocalPath = req.file?.path;
    

    const imageUploaded = await uploadOnCloudinary(imageLocalPath);

    console.log("\n the response after image uploaded", imageUploaded);

    const user = await User.create({
        fullname,
        phone,
        email,
        password,
        image: imageUploaded?.url || ""
    });

    const createdUser = await User.findOne({_id: user._id}).select("-password -refreshtoken");

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


