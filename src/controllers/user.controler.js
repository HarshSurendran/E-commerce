const asyncHandler = require("../utils/asynchandler.js")
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

//models
const User = require("../models/user.models.js");
const ProductVarient = require("../models/productvarient.models.js");
const Wishlist = require("../models/wishlist.models.js");
const Category = require("../models/category.models.js");
const Cart = require("../models/cart.models.js");
const Coupon = require("../models/coupon.models.js");
const Wallet = require("../models/wallet.models.js");
const Order = require("../models/order.models.js");
const Otp = require("../models/otp.models.js");

//controllers
const { checkOffer, applyOffer } = require("./offer.controller");

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { default: mongoose } = require("mongoose");

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

const verifiedUserLogin = asyncHandler( async (req,res)=>{
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(req.user);
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

    return res.status(200)
    .cookie("userAccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)    
    .redirect("/api/v1/users/home");
});

const loginUser = asyncHandler( async (req,res)=>{    
    try{
    const {value, password} = req.body;

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
        throw new ApiError(400, "User not found. Please Register");
    }

    if(user.isBlocked){
        throw new ApiError(400, "This User is blocked")
    }

    if(!user.isVerified){
        throw new ApiError(400, "Verification is not complete.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(400, "Entered wrong Password");
    }

    //generating access and refresh token to the user

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const userLoggedIn =  await User.findOne({_id: user._id}).select("-password -refreshToken");    

    const options ={
        httpOnly : true,
        secure: true 
    }    

    //sending the tokens to browser through cookie

    return res.status(200)
    .cookie("userAccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    // .json( new ApiResponse(
    //     200,
    //     {
    //     user: userLoggedIn,accessToken,refreshToken
    //     },
    //     "User succesfully logged in"
    // ));
    // .render("users/userhome", {user:userLoggedIn , title: "Urbane Wardrobe", products:productList})
    .redirect("/api/v1/users/home");
    } catch (error){
        console.log("This is error",error.message);
        res.render("userlogin", {common:true , title: "Urbane Wardrobe", message: error.message});
    }
});

const homePageRender = asyncHandler( async(req,res)=>{
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id});    
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    

    const productList1 = await ProductVarient.aggregate(
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
    
    const productList = await Promise.all(productList1.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category?.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }
        return element;
    }));

    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];

    res
    .status(200)
    .render("users/userhome", {user:req.user , title: "Urbane Wardrobe", products:rearrangedProducts, categorylayout, wishlistCountlayout, cartCountlayout});

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
    .clearCookie("userAccessToken", options)
    .clearCookie("RefreshToken", options)
    //.json(new ApiResponse(200,{},"User successfully logged out"));
    .render("landingPage", {common:true, title: "Urbane Wardrobe"});
});

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
});

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
    
});

const getCurrentUser = asyncHandler( async(req,res)=>{    
    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"User data retrival successfull"))
});

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
});

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
    res.render("users/otpvalidation", {userId : req.otp.userid, title:"Urbane Wardrobe", common:true});

    // return res.
    // status(200)
    // .json( new ApiResponse(
    //     200,
    //     {},
    //     "Otp sent to email"
    // ))
});

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


});

const addProfilepicture = asyncHandler( async(req,res)=>{
    const userId = req.user._id;
    const url = req.file.path;
    console.log("Entered update profdile ",url);
    
    const uploadedToCloudinary = await uploadOnCloudinary(url);
    
    if(!uploadedToCloudinary){
        throw new ApiError(500,`Error in uploading file `)
    }

    avatarPath = uploadedToCloudinary.url;
    
    const updated = await User.updateOne({_id: userId},{
        $set : { 
            image: avatarPath 
        }
    });

    if(!updated){
        throw new ApiError(500, "not updated")
    }

    res.redirect("/api/v1/users/test");
    
});

const resendotpsender = asyncHandler( async(req,res)=>{
    const generatedOtp = req.otp.otp;
    console.log("Entered resendotpsender", generatedOtp);

    // try{
        const user = await User.findOne({_id:req.body.userid}).select("-passwoed -refreshToken");
        //sending otp to senders mail
        const mailOptions = {
            from: "harshsurendran@gmail.com",
            to: user.email,
            subject: "OTP Verification",
            text: `Your OTP for verification is: ${generatedOtp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            throw new ApiError(500, "Something went wrong with sending email", error.message);   
            }
        });
        //while rendoring it to the otp verification page should send user email or id which should be given in hidden input form so that we will get to know who is the sender while verifying the code.
        res
        .status(200)
        .json( new ApiResponse(200,{},"Otp is sent to the user"));
    // }
    // catch (error) {
    //     res
    //     .status(500)
    //     .render("users/otpvalidation", {common:true, title:"Urbane Wardrobe", message: error.message})
    // }
});

const forgotPassOtpSender = asyncHandler( async(req,res)=>{
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
     
    console.log("This is the userid i am sending with the render",req.otp.userid);
    res
    .status(200)
    //.json( new ApiResponse(200,{},"otp is sent to email"));
    .render("forgotpassotppage", {userId : req.user._id, title:"Urbane Wardrobe", common:true});

});

const changePassFromOtp = asyncHandler( async(req,res)=>{
   
    const {userId, newPassword, confirmPassword} = req.body;

    if(!(newPassword === confirmPassword)){
        //throw new ApiError(400,"Passwords is not matching");
        res
        .status(400)
        .render("/changepassword",{common:true, title:"Urbane Wardrobe", message:"Password doesn't match"})
    }

    const user = await User.findOne({_id: userId});

    user.password = newPassword;
    const passwordChanged = await user.save({validateBeforeSave:false});

    if(!passwordChanged){
        res
        .status(400)
        .render("/changepassword",{common:true, title:"Urbane Wardrobe", message:"Failed to change password.Try again"})
    }

    const userAfterChange = await User.findOne({_id: userId});

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userId);

    console.log(accessToken);

    const userUpdated =  await User.updateOne(
        {
           _id: req.user
        },
        {
            isVerified: true
        }
    );
    
    const userLoggedIn = await User.findOne({_id:userId}).select("-password -refreshToken");

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
    .redirect("/api/v1/users/home");
});

const deleteUser = asyncHandler( async(req,res)=>{

    const id = req.params.id;   
    
    let deleteUser
    try{        
        deleteUser = await User.deleteOne({_id:id});
    }catch (error) {
        console.log("some error while deleting the user", error);
    }
    
    console.log("This is the response after deletion");
    
    const options ={
        httpOnly:true,
        secure: true
    }  

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("RefreshToken", options)
    //.json(new ApiResponse(200,{},"User successfully logged out"));
    .redirect("/api/v1");
});

const addToWishlist = asyncHandler( async(req,res)=>{
    const {productId} = req.body;
   
    try {
        const checkProduct = await Wishlist.findOne(
            {
                userId:  req.user._id,           
                productsId : productId
            }
        );        
        if(!checkProduct){            
            const wishlist = await Wishlist.updateOne(
                {
                    userId:  req.user._id
                },
                { $push: { productsId: new mongoose.Types.ObjectId(productId) } },
                {
                    upsert: true
                }
            );
            let updatedWishlist = await Wishlist.find({userId: req.user._id});    
            console.log("this is the wishlist count", updatedWishlist[0]);
            let wishlistCount = updatedWishlist[0]?.productsId.length;
            if(wishlist){
                res
                .status(200)
                .json( new ApiResponse(200,{wishlist, wishlistCount},"Product added to wishlist"));
            } else {
                res
                .status(400)
                .json( new ApiError(400,"Failed to add product to wishlist"));
            }
        } else {
            res
            .status(400)
            .json( new ApiError(400,"Product already exists in wishlist"));
        }
    } catch (error) {
        console.log("Error while adding product to wishlist", error);
        res.json( new ApiError(500, "Error while adding product to wishlist", error.message));
    }
});

const renderWishlist = asyncHandler( async(req,res)=>{
    //const wishlist = await Wishlist.findOne({userId: req.user._id})
    //.populate("productsId productsId.product_id")
    
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();    

    const wishlist = await Wishlist.aggregate([
        {
            $match: {
                userId: req.user._id
            }
        },
        {
            $unwind: "$productsId"
        },
        {
            $lookup : {
                from : "productvarients",
                localField : "productsId",
                foreignField : "_id",
                as : "productsId",
                pipeline : [
                    {
                        $lookup : {
                            from : "products",
                            localField : "product_id",
                            foreignField : "_id",
                            as : "product_id",
                            pipeline : [
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
                        $addFields: {
                            product_id: { $first: "$product_id" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                productsId: { $first: "$productsId" }
            }
        }
    ]);
    wishlist.forEach(element => {
        if (element.productsId.stock<1) {
            element.isOutofStock = true;
        }
    })

    console.log("this is the wishlist", wishlist);
    let message = "";
    if (wishlist.length === 0) {
        message = "Wishlist is empty, add some products";        
    }

    //res.json(new ApiResponse(200, {wishlist}));
    res
    .status(200)
    .render("users/wishlist", {wishlist, title: "Urbane Wardrobe", user:req.user, wishlistCountlayout, categorylayout, cartCountlayout, message});
});

const deleteWishlist = asyncHandler( async(req,res)=>{
    const {productId} = req.body;    
    const wishlist = await Wishlist.updateOne(
        {
            userId:  req.user._id
        },
        { 
            $pull: { productsId: new mongoose.Types.ObjectId(productId) } 
        }
    );
    if (!wishlist) {
        res
        .status(400)
        .json( new ApiError(400,"Failed to delete product from wishlist"));
        
    }
    res
    .status(200)
    .json( new ApiResponse(200,{},"Product deleted from wishlist"));
});

const renderProfilePage = asyncHandler( async(req,res)=>{
    console.log(req.user);
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id});
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    res.render("users/profile",{user:req.user, layout:"userprofilelayout", wishlistCountlayout, categorylayout, cartCountlayout});
});

const availableCoupons = asyncHandler( async(req,res)=>{
    const coupons = await Coupon.find({}).select(" -_id -createdAt -updatedAt -__v ");
    
    res
    .status(200)
    .json( new ApiResponse(200,{coupons}));
});

const renderWalletPage = asyncHandler(async (req, res) => {
    const user = req.user;
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id});
    console.log("This is wishlist",wishlistlayout);
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();

    const wallet = await Wallet.findOne({ userId: user._id });
    console.log("This is wallet : ",wallet);
    
    if (!wallet) {
        return res
        .status(200)
        .render("users/wallet", {user, title:"Urbane Wardrobe", layout: "userprofilelayout", wishlistCountlayout, categorylayout, cartCountlayout});       
    }

    wallet.transactions = wallet?.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(wallet);
    
    res
    .status(200)
    .render("users/wallet", {user, title:"Urbane Wardrobe", wallet, layout: "userprofilelayout", wishlistCountlayout, categorylayout, cartCountlayout});
});

const updateWallet = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id : orderId });
    
    const wallet = await Wallet.updateOne(
        {
            userId: req.user._id
        },
        {
            $inc: {
                balance: order.orderAmount
            },
            $push: {
                transactions: { amount: order.orderAmount , type: "deposit", date: Date.now() }
            }
        },
        {
            upsert: true
        }
    )    
    console.log("this is wallet", wallet);

    if (wallet.modifiedCount===0 && wallet.upsertedCount===0) {
        throw new ApiError(500, "Failed to update wallet");        
    }
    next();
});

const getWalletBalance = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    console.log(amount, "This is amount emtered wallet balance")
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if(!wallet){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the wallet"));
    }
    const balance = wallet.balance;
    
    return res
    .status(200)
    .json(new ApiResponse(200, {balance}, "Balance fetched successfully"));
});

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
});

const verifyOtp = asyncHandler( async(req,res,next)=>{
    console.log("This is verify otp function",req.body);
    const { userId, otp1,otp2,otp3,otp4,otp5,otp6 } = req.body
    console.log(userId);
    const otp = otp1+otp2+otp3+otp4+otp5+otp6;
    console.log(otp);
    let forgotPassword = req.body?.forgotpassword;
try{
    const userOtp = await Otp.findOne({userid:userId});
    const user = await User.findOne({_id: userId});    
    if(!user){
        throw new ApiError(400, "Registration timed out. Re-register again");
    }    
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

} catch(error){
    console.log("this is error", error)
    if (forgotPassword) {
        res.render("forgotpassotppage", {userId : userId, title:"Urbane Wardrobe", user:true, message: error.message});
    }
    res.render("users/otpvalidation", {userId : userId, title:"Urbane Wardrobe", user:true, message: error.message});
}
});


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
    homePageRender,
    addProfilepicture,
    resendotpsender,
    forgotPassOtpSender,
    changePassFromOtp,
    deleteUser,
    addToWishlist,
    renderWishlist,
    deleteWishlist,
    renderProfilePage,
    availableCoupons,
    renderWalletPage,
    updateWallet,
    getWalletBalance,
    getUserId,
    verifyOtp
}