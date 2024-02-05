const ApiError = require("../utils/ApiError.js");
const User = require("../models/user.models.js");
const asyncHandler = require("../utils/asynchandler.js");

const getUserId = asyncHandler( async(req,res,next)=>{

    const {email} = req.body;

    const user = await User.findOne({email}).select("-password -refreshToken");

    if(!user){
        res
        .status(400)
        .render("userlogin",{title:"Urbane Wardrobe", message:"Email is not registered", common:true})
    }

    req.user = user
    next();

})






module.exports = getUserId