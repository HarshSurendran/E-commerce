const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.models.js");
const asyncHandler = require("../utils/asynchandler.js")
const uploadOnCloudinary = require("../utils/cloudinary.js");
const fs = require("fs");


const insertUser = asyncHandler( async (req, res, next)=>{       
    const {fullname,phone,email,password,confirmpassword} = req.body;   

    //checking weather the same email or phone number exists    
    const emailExist = await User.findOne({email}).select("-password -refreshtoken -createdAt -updatedAt");
    if(emailExist){
        // throw new ApiError(400,"Email already exists");
        res.render("userregister", {title:"Urbane Wardrobe", message: "Email already exists", common:true});
    }
    const phoneExist = await User.findOne({phone}).select("-password -refreshtoken -createdAt -updatedAt");
    if(phoneExist){
        //throw new ApiError(400,"Phone number already exists");
        res.render("userregister", {title:"Urbane Wardrobe", message: "Phone number already exists", common:true});
    }
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(!strongPasswordRegex.test(password)){      
        res.render("userregister", {title:"Urbane Wardrobe", message: "Weak password", common:true});
    }
    console.log("this is emailExist :",emailExist);

    const user = await User.create({
        fullname,
        phone,
        email,
        password       
    });

    const createdUser = await User.findOne({_id: user._id}).select("-password -refreshtoken");
    
    let userid = createdUser._id
    if(!createdUser){
        throw new ApiError(500,"Error while registering a user");
    }
    
    setTimeout(async ()=>{
        console.log("This is setinterval function")
        let user = await User.findOne({_id: userid}).select("-password -refreshToken");
        console.log(user);
        if(user){
            if(!user.isVerified){  
                console.log("this is inside delete")          
            await User.deleteOne({_id:userid})                      
            }
        }
    },300000);

    req.user = createdUser;
    next();
});

module.exports = insertUser
