const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const jwt = require("jsonwebtoken");
// require modals
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Order = require("../models/order.models.js");
const mongoose = require("mongoose");

const renderLoginPage =  asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("admin/adminlogin", {title:"Urbane Wardrobe"})
})

const generateAccessAndRefreshToken = async (adminid)=>{
    try{
    const admin = await Admin.findOne({_id:adminid});    
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();    
    
    admin.refreshToken = refreshToken;
    admin.save({ validateBeforeSave:false });
    
    return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while creating Tokens")
    }
}

const verifyEmailPassword = asyncHandler( async(req,res)=>{

    try{
        console.log("Entered verify");
        const {email,password} = req.body;
        console.log(email, "email and pass" , password);
        if(email.trim()=="" || password.trim()==""){
            throw new ApiError(400,"Email and password is compulsory");
        }
        const admin = await Admin.findOne({email});
        if(!admin){
            throw new ApiError(400,"Invalid email-id");
        }
        const isPasswordCorrect = await admin.isPasswordCorrect(password);
        if(!isPasswordCorrect){
            throw new ApiError(400,"Incorrect Password");
        }

        res
        .status(200)
        .json( new ApiResponse( 200, {}, "Admin verified"));

    } catch(error){
        res
        .status(400)
        .json( new ApiError( 400, "Invalid Credentials"))
    }
})

const adminlogin = asyncHandler( async(req,res)=>{
    try{
        const {email, password} = req.body;
        // validation
        if(email.trim()=="" || password.trim()==""){
            throw new ApiError(400, "Email and Password can't be empty");
        }
        const admin = await Admin.findOne({email});
        if(!admin){
            throw new ApiError(400, "Unauthorised Email-id");
        }
        //checking password
        const isPasswordCorrect = await admin.isPasswordCorrect(password);
        if(!isPasswordCorrect){
            throw new ApiError(400, "Wrong Password");
        }
        //generate tokens
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(admin._id);

        console.log(accessToken,"new redresh token", refreshToken);

        const adminLoggedIn = Admin.findOne({_id:admin._id}).select("-password -refreshToken")
        
        const options ={
            httpOnly: true,
            secure: true
        }

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        // .json( new ApiResponse(
        //     200,
        //     {},
        //     "Admin logged in successfully"
        // ));
        // .render("admin/dashboard",{admin:true});
        .redirect("/api/v1/admin/dashboard");

    } catch(error){
        res.render("admin/adminlogin", {title:"Urbane Wardrobe", message: error.message})
    }
});

const renderDashboard = asyncHandler( async(req,res)=>{
    const adminDetails = req.admin;

    res
    .status(200)
    .render("admin/dashboard",{admin:adminDetails, title: "Urbane wardrobe" , adminDetails})
});

const logout = asyncHandler( async(req,res)=>{
    
    const admin = await Admin.updateOne(
        {
            _id: req.admin._id
        },
        {
            $unset: {refreshToken:1},
        },
        {
            new: true
        }
    );

    if(!admin){
        throw new ApiError(500, "Something went wrong while updating the refresh token")
    }

    const options ={
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    // .json( new ApiResponse(200,{},"admin logged out successfully"));
    .render("admin/adminlogin", {title:"Urbane Wardrobe"})
});

const userList = asyncHandler( async(req, res)=>{
    const userList = await User.find({}).select("-refreshToken");
    if(!userList){
        throw new ApiError(500,"Problem fetching user data");
    }

    res
    .status(200)
    .render("admin/userlist",{ admin:true, title:"Urbane Wardrobw", userDetails: userList});
});

const createUserPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("admin/addUser", {admin:true, title:"Urbane Wardrobe"})
})

const createUser = asyncHandler( async(req,res)=>{        
    console.log(req.body);
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

        const user = await User.create({
            fullname,
            phone,
            email,
            password,            
        });
    
        const createdUser = await User.findOne({_id: user._id}).select("-password -refreshtoken");
    
        if(!createdUser){
            throw new ApiError(500,"Error while registering a user");
        }
    
        return res
        .status(201)
        .redirect("users");
})

const blockUnblockUser = asyncHandler( async(req,res)=>{
    const id = req.params.userId;
    console.log(id);
    const user = await User.findOne({_id:id}).select("-password -isVerified -refreshToken");

    if(!user){
        throw new ApiError(500, "cannot find user")
    }

    if(user.isBlocked == true){
        console.log("Entered isblocked true");
        const userUpdated = await User.updateOne({_id:id},{
            $set: { isBlocked: false }
        });
    }else{
        console.log("Entered isblocked false");
        const userUpdated = await User.updateOne({_id:id},{
            $set: { isBlocked: true }
        });    
    }

    res
    .status(200)
    .json( new ApiResponse(200, {}, "task success"))
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
    
    res
    .status(200)
    .redirect("/api/v1/admin/users");
});

const renderOrdersPage = asyncHandler( async(req,res)=>{
    const orders = await Order.aggregate(
        [
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ["$user", 0]
                    }
                }
            }
        ]
        )

    orders.forEach((order)=>{
        const formattedCreatedAt = order.createdAt.toISOString().split('T')[0];
        order.createdAt = formattedCreatedAt;        
    });

    console.log("this is orders", orders);

    res
    .status(200)
    .render("admin/orderlist",{admin:true, title:"Urbane Wardrobe", orders});
});

const renderOrderDetailsPage = asyncHandler( async(req,res)=>{
    const orderid = req.params.id;
    const orderVarients = await Order.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(orderid) // orderid
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                _id : 1,
                                fullname : 1,
                                phone : 1,
                                email: 1
                            }
                        }
                    ]
                },
            },
            {
                $lookup: {
                    from: "addresses",
                    localField: "address",
                    foreignField: "_id",
                    as: "address",
                    pipeline: [
                        {
                            
                            $project: {
                                type : 1,
                                fullname: 1,
                                phone: 1,
                                street: 1,
                                locality: 1,
                                district: 1,
                                state: 1,
                                pincode: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$orderedItems"
            },
            {
                $lookup: {
                    from: "productvarients",
                    localField: "orderedItems.productVarientId",
                    foreignField: "_id",
                    as: "productVarient",
                    pipeline: [
                        {
                            $lookup: {
                                from: "products",
                                localField: "product_id",
                                foreignField: "_id",
                                as: "product",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "categories",
                                            localField: "category",
                                            foreignField: "_id",
                                            as: "category",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        category : 1
                                                    }
                                                }
                                            ]
                                        }
                                    },                            
                                    {                                       
                                        $project: {
                                            name : 1,
                                            category: 1
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
                            $project: {
                                _id:1,
                                product: 1,
                                images:1,
                                price:1
                            }
                        },
                        {
                            $addFields: {
                                product: { $first: "$product" }
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    productVarient: {
                        $arrayElemAt: ["$productVarient", 0]
                    },
                    user: {
                        $arrayElemAt: ["$user", 0]
                    },
                    address: {
                        $arrayElemAt: ["$address", 0]
                    }
                }
            }
        ]);

    const order = orderVarients[0];
    let subTotal = 0;
    orderVarients.forEach((order)=>{
        subTotal = subTotal + (order.productVarient.price * order.orderedItems.quantity)
    })

    let total = subTotal + 100;    

    res
    .status(200)
    .render("admin/orderdetails",{admin:true, title:"Urbane Wardrobe", order, orderVarients, subTotal, total});
});

const changeOrderStatus = asyncHandler( async(req,res)=>{
    
    const {orderId, status} = req.body;
    console.log("this is order id and status", orderId, status);
    const order = await Order.updateOne(
        {
            _id: orderId
        },
        {
            $set: {
                status
            }
        }
    );

    if(!order){
        return res
        .status(400)
        .json(new ApiResponse(400, null, "Something went wrong"));        
    }

    res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated"));
})


module.exports = {
    adminlogin,
    logout,
    renderDashboard,
    userList,
    blockUnblockUser,
    deleteUser,
    createUser,
    createUserPage,
    verifyEmailPassword,
    renderLoginPage,
    renderOrdersPage,
    renderOrderDetailsPage,
    changeOrderStatus
    
}