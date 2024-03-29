const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const jwt = require("jsonwebtoken");
// require modals
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Order = require("../models/order.models.js");
const Product = require("../models/product.models.js");
const Category = require("../models/category.models.js");

const mongoose = require("mongoose");
const cron = require("node-cron");
const moment = require("moment");

// //change order status through cron job
async function changeStatusToShipped() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);   
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const orders = await  Order.find({ 
        createdAt: { 
            $gt: fiveDaysAgo, 
            $lt: twoDaysAgo   
        } 
    })

    orders.forEach(element => {  
        if (element.status == "Placed") {
            element.status = "Shipped";
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}
async function changeStatusToDelivered() {     
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const orders = await  Order.find({ 
        createdAt: { 
            $lt: fiveDaysAgo,            
        } 
    })

    orders.forEach(element => {
        if (element.status == "Shipped") {
            element.status = "Delivered";
            if(element.paymentMethod == "COD"){
                element.paymentStatus = "Paid";
            }
            element.returnPeriod = true;
            element.paymentStatus = "Paid";
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}
async function changeStatusToReview() {     
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const orders = await  Order.find({ 
        createdAt: { 
            $lt: twentyDaysAgo, // Greater than twenty days ago            
        } 
    })

    orders.forEach(element => {
        if (element.status == "Delivered") {  
            element.returnPeriod = false;
            element.save({ validateBeforeSave:false });          
        }
    });

    console.log("These are the orders", orders);
}
//calling the cron job function
const task = cron.schedule('30 11 * * *', () => 
    {   
        changeStatusToShipped();
        changeStatusToDelivered();
        changeStatusToReview();
    },
    {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    }
);
task.start();

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

function getMonthNumber(monthName) {
    console.log("the month input", monthName)
    const months = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11
    };    
    const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
    console.log("this is formatted name", formattedMonthName)
    console.log("month number", months[formattedMonthName])
    return months[formattedMonthName];
}

const renderLoginPage =  asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("admin/adminlogin", {title:"Urbane Wardrobe"})
});

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
});

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
        .cookie("adminAccessToken", accessToken, options)
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
    let sales = await Order.aggregate([
        {
            $group: {
                _id: "Sales",
                total : { $sum : "$orderAmount" }
            }
        }
    ]);
    let orders = await Order.countDocuments({});
    sales = sales[0].total
    let products = await Product.countDocuments({});
    let category = await Category.countDocuments({});
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);    
    let salesData = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            }
        },
        {
            $group: {
                _id: null,
                OrderAmount: { $sum: "$orderAmount" } 
            }
        }
    ]);
    
    salesData = salesData[0]?.OrderAmount || 0;

    res
    .status(200)
    .render("admin/dashboard",{admin:adminDetails, title: "Urbane wardrobe" , adminDetails, sales, orders, products, category, salesData});
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
    .clearCookie("adminAccessToken", options)
    .clearCookie("refreshToken", options)
    // .json( new ApiResponse(200,{},"admin logged out successfully"));
    .render("admin/adminlogin", {title:"Urbane Wardrobe"})
});

const userList = asyncHandler( async(req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;   
    
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);    
    const userList = await User.find({}).select("-refreshToken").skip(skip).limit(limit);
    if(!userList){
        throw new ApiError(500,"Problem fetching user data");
    }
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    res
    .status(200)
    .render("admin/userlist",{ admin:true, title:"Urbane Wardrobw", userDetails: userList, totalCount, totalPages, currentPage: page, pages});
});

const createUserPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("admin/addUser", {admin:true, title:"Urbane Wardrobe"})
});

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
});

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

const userDetails = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    const user = await User.findOne({_id:id}).select("-password -isVerified -refreshToken");
    if(!user){
        throw new ApiError(500, "cannot find user")
    }
    return res
    .status(200)
    .render("admin/userdetails",{admin:true, title:"Urbane Wardrobe", userDetails: user});
});

const editUserDetails = asyncHandler( async(req,res)=>{
    const {fullname, gender, phone, dateofbirth, userId} = req.body;
    console.log(fullname," ",gender," ",phone, " ", dateofbirth);

    
    const user = await User.updateOne(
        {
            _id: userId
        },
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

const graphData = asyncHandler( async (req,res)=>{
    let salesData =
    {
        "labels": [],
        "salesData": [],
        "revenueData": [],
        "productsData": []
    }
    const { filter, time } = req.body    

    if(filter === "monthly"){
        salesData.labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const contraints = {
            $gte: new Date(`${time}-01-01T00:00:00.000Z`),
            $lte: new Date(`${time}-12-31T00:00:00.000Z`)            
        }
        const sales = await Order.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                        $month: "$createdAt"
                    },
                    revenueData: {
                        $sum: "$orderAmount"
                    },
                    salesData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ])
        const products = await Product.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                        $month: "$createdAt"
                    },
                    productsData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id": 1 // Sort by month in ascending order
                }
            }
        ])
        salesData.salesData = sales.map((item) => item.salesData);
        salesData.revenueData = sales.map((item) => item.revenueData/1000);
        salesData.productsData = products.map((item) => item.productsData);

    }else{
        console.log("Entered else condition");
        salesData.labels = [`${time-10}`, `${time-9}`, `${time-8}`, `${time-7}`, `${time-6}`, `${time-5}`, `${time-4}`, `${time-3}`, `${time-2}`, `${time-1}`, `${time}`];
        const contraints = {
            $gte: new Date(`${time-10}-01-01T00:00:00.000Z`),
            $lte: new Date(`${time}-12-31T00:00:00.000Z`)            
        }
        const sales = await Order.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                        $year: "$createdAt"
                    },
                    revenueData: {
                        $sum: "$orderAmount"
                    },
                    salesData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ])
        const products = await Product.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                        $year: "$createdAt"
                    },
                    productsData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id": 1 
                }
            }
        ])

        for(let key of sales){
            console.log("this is ind", key)
            for(let data of salesData.labels){
                console.log("iteratong", data)                
                if (key._id == data) {                        
                    salesData.salesData.push(key.salesData) 
                    salesData.revenueData.push(key.revenueData/1000)
                }else{
                    salesData.salesData.push(0)
                    salesData.revenueData.push(0)
                }                    
            }            
        }
        for(let key of products){
            console.log("this is ind", key)
            for(let data of salesData.labels){
                console.log("iteratong", data)                
                if (key._id == data) {                        
                    salesData.productsData.push(key.productsData) 
                }else{
                    salesData.productsData.push(0)
                }                    
            }            
        }

    }

    res
    .status(200)
    .json(salesData)
});

const renderSalesReportPage = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;   
    
    const totalCount = await Order.find({paymentStatus:"Paid"}).countDocuments();    
    const totalPages = Math.ceil(totalCount / limit);

    let orders = await Order.find({paymentStatus:"Paid"}).populate("userId").sort({createdAt: -1}).skip(skip).limit(limit);
    if (!orders) {
        res
        .status(400)
        .json( new ApiError(400, null, "Could not find orders"))
    }
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }
    
    res.render("admin/salesreport",{admin:true, orders, totalCount, totalPages, currentPage: page, pages});
});

const getSalesReport = asyncHandler(async (req, res) => {
    const {fromDate, toDate} = req.body;
    console.log(fromDate, toDate);
    let orders = await Order.find({createdAt: {$gte: new Date(fromDate), $lte: new Date(toDate)},  paymentStatus: "Paid"}).populate("userId").sort({createdAt: -1});

    if (!orders) {
        res
        .status(400)
        .json( new ApiError(400, null, "Could not find orders"))        
    }

    res
    .status(200)
    .json( new ApiResponse(200, orders, "Orders fetched successfully."));
});

const salesReportFilter = asyncHandler(async (req, res) => {    
    let {filter } = req.body;
    console.log(filter)
    let groupstage;
    if(filter === "week"){
        groupstage = {
            $group: {
                _id: { $week: "$createdAt" }, 
                count: { $sum: 1 }, 
                totalAmount: { $sum: "$orderAmount" },
                totalCouponDiscount: { $sum: "$couponDiscount" },
                couponDiscountCount: {
                    $sum: { $cond: { if: { $gt: ["$couponDiscount", 0] }, then: 1, else: 0 } }
                }
            }
        }
    }else if(filter === "month"){
        groupstage = {
            $group: {
                _id: { $month: "$createdAt" }, 
                count: { $sum: 1 }, 
                totalAmount: { $sum: "$orderAmount" },
                totalCouponDiscount: { $sum: "$couponDiscount" },
                couponDiscountCount: {
                    $sum: { $cond: { if: { $gt: ["$couponDiscount", 0] }, then: 1, else: 0 } }
                }
            }
        }
    }else{
        groupstage = {
            $group: {
                _id: { $year: "$createdAt" }, 
                count: { $sum: 1 }, 
                totalAmount: { $sum: "$orderAmount" },
                totalCouponDiscount: { $sum: "$couponDiscount" },
                couponDiscountCount: {
                    $sum: { $cond: { if: { $gt: ["$couponDiscount", 0] }, then: 1, else: 0 } }
                }
            }
        }
    }

    const weeklyPaidOrders = await Order.aggregate([
        {
            $match: {
                paymentStatus: "Paid" 
            }
        },
        groupstage,
        {
            $sort: { _id: -1 } 
        }
    ]);

    if(!weeklyPaidOrders){
        throw new ApiError(500, "Something went wrong while fetching sales report")
    }
    
    res
    .status(200)
    .json( new ApiResponse(200, weeklyPaidOrders, "Sales report fetched successfully."));
}); 

const categoryPage = asyncHandler( async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;   
    
    const totalCount = await Category.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    let category = await Category.find({}).select(" -updatedAt").skip(skip).limit(limit);
    if(!category){
        throw new ApiError(500, "Couldnt fetch category data");
    }

    const updatedCategory = category.map((element) => {       
        console.log(element)
        const dateString = element.createdAt;
        const dateObject = new Date(dateString);
        const day = dateObject.getDate();
        const month = dateObject.getMonth() + 1; 
        const year = dateObject.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        console.log(formattedDate);
        
        return {
            ...element.toObject(), 
            date: formattedDate,
        }
    });
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    const bestSellingCategories = await Order.aggregate([
        {
          $unwind: "$orderedItems" 
        },
        {
          $lookup: {
            from: "productvarients",
            localField: "orderedItems.productVarientId",
            foreignField: "_id",
            as: "productVariant"
          }
        },
        {
          $unwind: "$productVariant"
        },
        {
          $lookup: {
            from: "products",
            localField: "productVariant.product_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind: "$category"
        },
        {
          $group: {
            _id: "$category.category", // Assuming category has a "name" field
            totalSoldQuantity: { $sum: "$orderedItems.quantity" }
          }
        },
        {
          $sort: { totalSoldQuantity: -1 }
        }
    ]);      
      
    res
    .status(200)
    .render("admin/category",{ admin:true, title:"Urbane Wardrobe", category:updatedCategory, bestSellingCategories, totalCount, totalPages, currentPage: page, pages});
})

const addCategory = asyncHandler( async(req,res)=>{
    const {category} = req.body;

    const categoryExist = await Category.findOne({ category: { $regex: `^${category}$`, $options: 'i' } }); 

    if(categoryExist){
        throw new ApiError(400,"Category already exist");
    }

    const cat = await Category.create({
        category
    });

    if(!cat){
        throw new ApiError(500,"something went wrong while uploading category to database")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200, 
        cat, 
        "category successfully added"
        )
    );    
})

const editCategory = asyncHandler( async(req,res)=>{
    const {category, id} = req.body;
    console.log("edit cat",category);
    const categoryExist = await Category.findOne({ category: { $regex: `^${category}$`, $options: 'i' } });
    console.log("This is categ exist",categoryExist);

    if(categoryExist){        
        return res
        .status(500)
        .json( new ApiError(500, "Category already exist."));        
    }
    
    const catedited = await Category.updateOne(
            {
                _id:id
            },
            {
                $set: {category}
            }
        );
    
    if(!catedited){
        return res
        .status(500)
        .json( new ApiError(500, "Category not updated."));
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {catedited}, "Category updated"));

})

const deleteCategory = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    console.log("This is delte id " ,id);

    if(!id){
        throw new ApiError(400, "Bad request");
    }

    const deleted = await Category.deleteOne({_id:id});

    res
    .status(200)
    .redirect("/api/v1/admin/category");
});



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
    userDetails,
    editUserDetails,
    graphData,
    renderSalesReportPage,
    getSalesReport,
    salesReportFilter,
    categoryPage,
    addCategory,
    editCategory,
    deleteCategory
}