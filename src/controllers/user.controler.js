const asyncHandler = require("../utils/asynchandler.js")
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

//models
const User = require("../models/user.models.js");
const ProductVarient = require("../models/productvarient.models.js");


const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


//Functions for use inside this file
const generateAccessAndRefreshToken = async (userid)=>{
    try{
    const user = await User.findOne({_id:userid});
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave:false });

    return {accessToken, refreshToken}

    } catch(error){
        throw new ApiError(200,"Something went wrong while creating Tokens")
    }
}

//declaration of nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLEEMAIL,
      pass: process.env.GOOGLEPASSWORD,
    },
});

// const registerUser = asyncHandler(async(req,res)=>{   
//     console.log(req.body);
//     const {fullname,phone,email,password} = req.body;
//     console.log(fullname);

//     //validation
//     if(fullname.trim() === ""){
//         throw new ApiError(400, "fullname is required")
//     }else if(email.trim() === ""){
//         throw new ApiError(400, "email is required")
//     }else if(password.trim() === ""){
//         throw new ApiError(400, "password is required")
//     }
//     let nameRegex = /^[A-Z]/
//     if(!fullname.match(nameRegex)){
//         throw new ApiError(400, "First name has to start with a capital letter")     
//     }
//     let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/       
//     if(!email.match(emailRegex)){
//         throw new ApiError(400, "Email is not valid")
//     }

//     const emailExist = await User.findOne({email})
    
//     if(emailExist){
//         console.log("Details of existing email id", emailExist);
//         throw new ApiError(409,"Email already exists");
//     }
    
//     //file handling
//     console.log(req.file);

//     if(!req.file){
//         throw new ApiError(500,"Image path is null");
//     }

//     const imageLocalPath = req.file?.path;
    

//     const imageUploaded = await uploadOnCloudinary(imageLocalPath);

//     console.log("\n the response after image uploaded", imageUploaded);

//     const user = await User.create({
//         fullname,
//         phone,
//         email,
//         password,
//         image: imageUploaded?.url || ""
//     });

//     const createdUser = await User.findOne({_id: user._id}).select("-password -refreshtoken");

//     if(!createdUser){
//         throw new ApiError(500,"Error while registering a user");
//     }

//     return res
//     .status(201)
//     .json(new ApiResponse(
//         200,
//         createdUser,
//         "User registered Successfully"
//         )
//     )
// })

const verifiedUserLogin = asyncHandler( async (req,res)=>{

    console.log(req.user);

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(req.user);

    console.log(accessToken);

    const userUpdated =  await User.updateOne(
        {
           _id: req.user
        },
        {
            isVerified: true
        }
    );
    
    const userLoggedIn = await User.findOne({_id:req.user}).select("-password -refreshToken");

    console.log(userLoggedIn);    

    const options ={
        httpOnly : true,
        secure: true 
    }

    // sending the tokens to browser through cookie

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    // .json( new ApiResponse(
    //     200,
    //     {
    //     user: userLoggedIn,accessToken,refreshToken
    //     },
    //     "User succesfully logged in"
    // ));
    .render("users/userhome",{user:userLoggedIn});
})

const loginUser = asyncHandler( async (req,res)=>{
    // steps needed:-
    // Validate empty input -Done
    // Find the input value type(email or password) and then find the user in database -Done
    // check wether the password is correct -Done
    // generate refresh and accesstoken -Done
    // respond with access and refresh token in cookie -Done
    
    const {value, password} = req.body;

    console.log(value,"and",password);

    //validation of value and password
    if(value.trim()==""){
        throw new ApiError(400,"Email or Phone Number is compulsory");
    }else if(password.trim()==""){
        throw new ApiError(400,"password is compulsory")
    }
    
    // checking wether the input is email or phone number and checking wther the user exist
    const phoneRegex = /^\d{10}$/;    
    let phone,email;
    if(phoneRegex.test(value)){
       phone = value; 
    }else{
       email = value; 
    }

    const user = await User.findOne( {$or: [{phone},{email}]} );

    if(!user){
        throw new ApiError(400, "user not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(400, "Entered wrong credentials");
    }

    //generating access and refresh token to the user

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const userLoggedIn =  await User.findOne({_id: user._id}).select("-password -refreshToken");

    console.log(userLoggedIn);

    const options ={
        httpOnly : true,
        secure: true 
    }
    //fetching data to user home page
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

    //sending the tokens to browser through cookie

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    // .json( new ApiResponse(
    //     200,
    //     {
    //     user: userLoggedIn,accessToken,refreshToken
    //     },
    //     "User succesfully logged in"
    // ));
    .render("users/userhome", {user:userLoggedIn , title: "Urbane Wardrobe", products:productList})
    
})

const homePageRender = asyncHandler( async(req,res)=>{

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
    .status(200)
    .render("users/userhome", {user:req.user._id , title: "Urbane Wardrobe", products:productList})

});

const logoutUser = asyncHandler( async (req,res)=>{
    // get data about the user
    // delete the refreshtoken 
    const user = await User.updateOne({_id:req.user._id},{$unset: {refreshToken: 1}},{new: true});

    if(!user){
        throw new ApiError(500, "Something went wrong while deleting refresh token");
    }

    const options ={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200,{},"User successfully logged out"));
})

const refreshAccessToken = asyncHandler( async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400, "Unauthorised Request");
    }
    
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findOne({_id: decodedToken._id});
    if(!user){
        throw new ApiError(400, "Unvalid Token");
    }
    if(decodedToken._id !== user?.refreshToken){
        throw new ApiError(400, "Refresh token expired");
    }

    const {accessToken,newRefreshToken} = generateAccessAndRefreshToken(user._id);
    console.log("AccessToken is ", accessToken);

    const options={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json( new ApiResponse(
        200,
        {
        accessToken,
        refreshToken: newRefreshToken
        },
        "Access Token refreshed succesfully"
        ));
})

const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400,"Passwords is not matching");
    }

    const user = await User.findOne({_id: req.user?._id});

    const passwordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!passwordCorrect){
        throw new ApiError(400,"Incorrect old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Password updated successfully"))   
    
})

const getCurrentUser = asyncHandler( async(req,res)=>{    
    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"User data retrival successfull"))
})

const updateUserDetails = asyncHandler( async(req,res)=>{

    const {fullname, gender, phone, dateofbirth} = req.body;
    console.log(fullname," ",gender," ",phone, " ", dateofbirth);

    console.log(req.user._id);

    const user = await User.updateOne(
        {_id:req.user._id},
        {
            $set : {fullname:fullname, gender: gender, phone: phone, dateofbirth: dateofbirth}
        },
        {
            new: true
        }
    ).select("-password");

    console.log(user);
    
    return res
    .status(200)
    .json( new ApiResponse(
        200,
        user,
        "User data updated successfully"
    ));
})

const otpPageLoader = asyncHandler( async(req,res)=>{
    
    const generatedOtp = req.otp.otp;
    //sending otp to senders mail
    const mailOptions = {
        from: "harshsurendran@gmail.com",
        to: req.user.email,
        subject: "OTP Verification",
        text: `Your OTP for verification is: ${generatedOtp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          throw new ApiError(500, "Something went wrong with sending email", error.message);   
        }
    });

    //while rendoring it to the otp verification page should send user email or id which should be given in hidden input form so that we will get to know who is the sender while verifying the code. 
    console.log("This is the userid i am sending with the render",req.otp.userid);
    res.render("users/otpvalidation", {userId : req.otp.userid, title:"Urbane Wardrobe", user:true});

    // return res.
    // status(200)
    // .json( new ApiResponse(
    //     200,
    //     {},
    //     "Otp sent to email"
    // ))
})

const allproductlist = asyncHandler( async(req,res)=>{
    const allProducts = await ProductVarient.aggregate({
        $lookup : {
            from: "products",
            foriegnfield: _id,
            localfield: product,
            as:pr
            
        }
    })

    if(!allProducts){
        throw new ApiError(500,"Something went wrong while fetching product list from databases")
    }

    res.render("users/allproductlist", {product: allProducts})


})


module.exports = {    
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    otpPageLoader,
    verifiedUserLogin,
    allproductlist,
    homePageRender
}