const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const User = require("../models/user.models");
const Admin = require("../models/admin.models.js");
const asyncHandler = require("../utils/asynchandler.js");
const ProductVarient = require("../models/productvarient.models.js")

const verifyUserJWT = asyncHandler( async(req,res,next)=>{
    let blocked;
    try {
        
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            blocked = null
            throw new ApiError(401,"Unauthorised request");
        }

        // decoding the token and verifying it with user
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
        
        if(!user){
            blocked= null
            throw new ApiError(401,"Invalid access token");
        }

        if(user.isBlocked){
            blocked = "This user is blocked. Please contact with admin."            
            throw new ApiError(400, "The user is blocked");
        }
       
        // giving the user_id to the request property
        req.user = user;
        next();       
        
    } catch (error) {
        // throw new ApiError(401,"Verification of JWT unsuccessful.",error)        
        const options ={
            httpOnly:true,
            secure: true
        }

        const productList = await ProductVarient.aggregate(
            [   
                {
                    $lookup: {
                        from: "products",
                        localField : "product_id",
                        foreignField : "_id",
                        as: "name",
                        pipeline: [
                            {
                                $match: {
                                    islisted : true
                                }
                            },
                            {
                                $lookup: {
                                    from: "categories",
                                    localField: "category",
                                    foreignField: "_id",
                                    as: "category"
                                }
                            },
                            {
                                $addFields: {
                                    category: { $first: "$category" }
                                }
                            }
                        ]
                    }        
                },
                {
                    $lookup: {
                        from: "colors",
                        localField : "color_id",
                        foreignField : "_id",
                        as: "color"
                    } 
                },
                {
                    $lookup: {
                        from: "sizes",
                        localField : "size_id",
                        foreignField : "_id",
                        as: "size"
                    } 
                },
                {            
                    $addFields : {
                        name : { $first: "$name" },
                        color : { $first: "$color"},
                        size : { $first: "$size" },
                    }                       
                },
                {
                    $project : {
                        name:1,
                        color:1,
                        size:1,
                        images:1,
                        stock:1,
                        price:1
                    }
                }
            ]
            );
        
        
        
        res
        .status(400)
        .clearCookie("accessToken", options)
        .clearCookie("RefreshToken", options)
        //.redirect("/api/v1/");
        .render("landingPage", {common:true , title: "Urbane Wardrobe" , products: productList, blocked });
    }
})

const verifyAdminJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "Unauthorised request");
        }

        // decoding the token and verifying it with user
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const admin = await Admin.findOne({_id: decodedtoken._id}).select("-password -refreshToken");

        if(!admin){
            throw new ApiError(401,"Invalid access token");
        }

        // giving the admin details to the request property
        req.admin = admin;
        next();       
        
    } catch (error) {
        // throw new ApiError(401,"Verification of JWT unsuccessful.",error)
        res.redirect("/api/v1/admin");
    }
})

const checkUserJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(token){
            const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const user = await User.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
            if(user){
                res.redirect("/api/v1/users/home");      
            }            
        }
        next();

    } catch(error) {
        console.log(error);
    }

});

const checkAdminJWT = asyncHandler( async(req,res,next)=>{
    try {
        //getting token from request
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(token){
            const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const admin = await Admin.findOne({_id: decodedtoken._id}).select("-password -refreshToken");
            if(admin){
                res.redirect("/api/v1/admin/dashboard")            
            }
            
        }

        next();
    } catch(error) {
        console.log(error);
    }

});

const checkIsBlocked = asyncHandler( async(req,res,next)=>{
    const user = req.user;
    console.log("This is checkingi s blocked", user)
    const check = User.findOne({_id: user._id}).select("-refreshToken -createdAt -updatedAt")
    console.log("this is check.isblocked",check.isBlocked);
    if(check.isBlocked){

        const options ={
            httpOnly:true,
            secure: true
        }

        res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("RefreshToken", options)
        .redirect("/api/v1");
    }
    next();
})

module.exports = {
    verifyUserJWT,
    verifyAdminJWT,
    checkUserJWT,
    checkAdminJWT,
    checkIsBlocked
};