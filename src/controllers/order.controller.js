const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
// require models
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Address = require("../models/address.models.js");
const Cart = require("../models/cart.models.js");
const Order = require("../models/order.models.js");
const Wallet = require("../models/wallet.models.js");
const Category = require("../models/category.models.js");
const Wishlist = require("../models/wishlist.models.js");
const ProductVarient = require("../models/productvarient.models.js");
const Coupon = require("../models/coupon.models.js");

const { checkOffer, applyOffer } = require("./offer.controller");

const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//code for distance calculation
const NodeGeocoder = require('node-geocoder');
const { toNamespacedPath } = require("path");    
const options = {
provider: 'openstreetmap'
};
// Initialize geocoder
const geocoder = NodeGeocoder(options);    
async function calculateDistance(sourceAddress, destinationAddress) {
    try {        
        let [sourceLocation, destinationLocation] = await Promise.all([
        geocoder.geocode(sourceAddress),
        geocoder.geocode(destinationAddress)
        ]);      
        console.log("destination address", destinationLocation);
        destinationLocation = destinationLocation.filter((element)=>{
            return element.countryCode === "IN"
        })
        
        const sourceCoords = [sourceLocation[0].latitude, sourceLocation[0].longitude];
        const destinationCoords = [destinationLocation[0].latitude, destinationLocation[0].longitude];
        const distance = getDistance(sourceCoords, destinationCoords);        
        return distance;        
    } catch (error) {
        console.log(error)
        console.error('Error:', error.message);
    }
}    
function getDistance(sourceCoords, destinationCoords) {
    const [lat1, lon1] = sourceCoords;
    const [lat2, lon2] = destinationCoords;

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}    
function deg2rad(deg) {
return deg * (Math.PI / 180);
}
function calculateDeliveryCharge(distance){
    let charge = distance * 0.25;
    charge = Math.ceil(charge);
    console.log("This is the delivery charge ", charge);
    return charge;
}

const state = [    
    { name: "Andhra Pradesh" },
    { name: "Arunachal Pradesh" },
    { name: "Assam" },
    { name: "Bihar" },
    { name: "Chandigarh" },
    { name: "Chhattisgarh" },
    { name: "Dadra and Nagar Haveli" },
    { name: "Daman and Diu" },
    { name: "Delhi" },
    { name: "Goa" },
    { name: "Gujarat" },
    { name: "Haryana" },
    { name: "Himachal Pradesh" },
    { name: "Jammu and Kashmir" },
    { name: "Jharkhand" },
    { name: "Karnataka" },
    { name: "Kerala" },
    { name: "Ladakh" },
    { name: "Lakshadweep" },
    { name: "Madhya Pradesh" },
    { name: "Maharashtra" },
    { name: "Manipur" },
    { name: "Meghalaya" },
    { name: "Mizoram" },
    { name: "Nagaland" },
    { name: "Odisha" },
    { name: "Puducherry" },
    { name: "Punjab" },
    { name: "Rajasthan" },
    { name: "Sikkim" },
    { name: "Tamil Nadu" },
    { name: "Telangana" },
    { name: "Tripura" },
    { name: "Uttar Pradesh" },
    { name: "Uttarakhand" },
    { name: "West Bengal" }
  ];
function generateOrderId() {
    let orderId = Math.floor(10000000 + Math.random() * 90000000);
    return orderId;
}
function generateRazorpayOrder(orderid, total){
    return new Promise((resolve, reject)=>{
        var options = {
            amount: total*100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: ""+orderid
        };
        instance.orders.create(options, function(err, order){
            if(err){
                console.log(err);
                reject(err);
            }
            console.log("This is your order  :",order);
            resolve(order);
        });
    })
}

const checkOutPage = asyncHandler( async(req,res)=>{
    const couponCode = req.body.couponCode;
    console.log("this is the coupon code", couponCode);
    const user = req.user
    const address = await Address.find({userid: user._id })

    const cart = await Cart.aggregate([
        {
          $match: {
              user_id : user._id
          }
        },
        {
          $lookup: {
            from: "productvarients",
            localField: "productVarient_id",
            foreignField: "_id",
            as: "productVarient_id",
            pipeline: [
                {
                    $lookup: {
                        from: "products",
                        localField : "product_id",
                        foreignField : "_id",
                        as: "product_id",
                        pipeline: [
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
                        as: "color_id"
                    } 
                },
                {
                    $lookup: {
                        from: "sizes",
                        localField : "size_id",
                        foreignField : "_id",
                        as: "size_id"
                    } 
                },
                {
                    $addFields: {
                        product_id: { $first: "$product_id" },
                        color_id : { $first: "$color_id"},
                        size_id : { $first: "$size_id" },
                    }
                }
            ]
          }
        },
        {
            $addFields : {
                productVarient_id: { $first: "$productVarient_id" },
            }
        }
    ])

    let total = 0;
    for (const element of cart) {
        const offer = await checkOffer(element.productVarient_id.product_id.category?.category);
        if (offer) {
            element.productVarient_id.originalprice = element.productVarient_id.price;
            element.productVarient_id.price = applyOffer(element.productVarient_id.price, offer.discount);
            element.offerApplied = true;
        }
        console.log("this is price after applying offer", element.productVarient_id.price);
        total += element.quantity * element.productVarient_id.price;
    }
    
    // discount and shipping logic
    let discount = 0;
    if (couponCode) {
        const coupon = await Coupon.findOne({code: couponCode});
        if (coupon) {
            if (coupon.minamount > total) {
                discount = 0;
                return res.status(400)
            }
            if(coupon.userlimit<= 0){
                discount = 0;
                return res.status(400)
            }
            discount = coupon.discount
        }
    }

    let shipping = 0;
    const lastAddressDocument = address[address.length - 1];    
    if(lastAddressDocument){
        let pincode = lastAddressDocument.pincode
        pincode = pincode.toString(); 
        let distance = await calculateDistance("673639", pincode);      
        shipping = calculateDeliveryCharge(distance);        
    }
    if (!shipping) {
        shipping = 0;        
    }
    console.log("this is final shipping", shipping)    

    res
    .status(200)
    .render("users/checkout",{title:"Urbane Wardrobe", address, total, discount, shipping , state, couponCode})
});

const createOrder = asyncHandler( async(req,res)=>{
    try{
        const user = req.user;
        const {paymentMethod, address, couponCode} = req.body; 
        
        const orderId = generateOrderId();        
        console.log("Thisisis the input to order placed",paymentMethod, address)

        const cart = await Cart.aggregate([
            {
            $match: {
                user_id : user._id
            }
            },
            {
            $lookup: {
                from: "productvarients",
                localField: "productVarient_id",
                foreignField: "_id",
                as: "product",
                pipeline: [   
                    {
                        $lookup: {
                            from: "products",
                            localField : "product_id",
                            foreignField : "_id",
                            as: "name",
                            pipeline: [
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
            }
            },
            {
                $addFields: {
                    product: { $first: "$product" }
                }
            }
        ])
        if (cart.length === 0) {
            return res
            .status(420)
            .json(new ApiError(420, "Cart is empty"));
        }
        let total = 0;
        let orderedItems = [];
        try{
        const promises = cart.map(async (element) => {
            const productVarient = await ProductVarient.findOne({ _id: element.productVarient_id });
            if (!productVarient) {
                throw new ApiError(404, "Product variant not found");
            }            
            if ((productVarient.stock - element.quantity) < 0) {
                throw new ApiError(410, "Insufficient stock");
            }            

            orderedItems.push({ productVarientId: element.productVarient_id, quantity: element.quantity });

            const offer = await checkOffer(element.product.name.category?.category);
            if (offer) {                
                element.product.price = applyOffer(element.product.price, offer.discount);
                element.offerApplied = true;
                console.log("this is price after applying offer", productVarient.price);
            }
            total = total + (element.quantity * element.product.price);
        });
        
        await Promise.all(promises);

        }catch(error){
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json(new ApiError(error.statusCode, error.message));
            } else {
                console.error(error);
                return res.status(500).json(new ApiError(500, "Internal server error"));
            }
        }
        
        let coupon=''
        if(couponCode){
            coupon = await Coupon.findOne({code: couponCode});            
            if(coupon){
                if (coupon.userlimit <= 0) {
                    return res
                    .status(411)
                    .json(new ApiError(411, "Coupon is expired"));
                }
                coupon.userlimit = coupon.userlimit - 1;
                await coupon.save();
                total = total - coupon.discount;
            }
        }
//delivery charge calculator
        const deliveryAddress = await Address.findOne({_id: address})        
        let pincode = deliveryAddress.pincode;
        pincode = pincode.toString();        
        let distance = await calculateDistance("673639", pincode); 
        deliveryCharge = calculateDeliveryCharge(distance);
        if(deliveryCharge){
            total = total + deliveryCharge;
        }else{
            deliveryCharge = 0;
        }

        if(paymentMethod === "Wallet"){
            const wallet = await Wallet.findOne({ userId: user._id });
            if (!wallet) {
                return res
                .status(408)
                .json(new ApiError(408, "Insufficient balance"));
            }
            if(wallet.balance < total){
                return res
                .status(408)
                .json(new ApiError(408, "Insufficient balance"));
            }
            const walletUpdate = await Wallet.updateOne(
                {
                    userId: user._id
                },
                {
                    $inc: {
                        balance: -total
                    },
                    $push: {
                        transactions: { amount: -total , type: "withdrawal", date: Date.now() }
                    }
                }
            );
            if (!walletUpdate.modifiedCount) {
                return res
                .status(500)
                .json(new ApiError(500, "Failed to update wallet"));
            }         
        }

        const order = await Order.create({
            userId: user._id,
            address,
            paymentMethod : paymentMethod,
            orderAmount: total,
            orderedItems,
            orderId,
            couponCode,
            couponDiscount: coupon.discount,
            deliveryCharge
        });
                    
        for(const element of cart){
            //update the stock 
            const productVarientUpdate = await ProductVarient.updateOne(
                { 
                    _id: element.productVarient_id 
                }, 
                { 
                    $inc: { stock: -element.quantity, sold_count: element.quantity } 
                }
            );
        }       

        const orderConfirm = await Order.findOne({_id: order._id}).populate("userId")

        if(!orderConfirm){
            throw new Error("Order not placed server error");
        }

        console.log("This is the confirmed order", orderConfirm);       

        //check payment method 
        if(paymentMethod==="COD"){
            const updateOrder = await Order.updateOne(
                    {
                        _id: orderConfirm._id
                    },
                    {
                        $set: {
                            status: "Placed"
                        }
                    }
                )
            if(!updateOrder.modifiedCount){
                return res
                .status(500)
                .json( new ApiError(500, "Order status not updated, server error", error));
            }

            await Cart.deleteMany({user_id: user._id});
            return res
            .status(200)
            .json( new ApiResponse(200, {orderConfirm , codpayment:true}, "Order placed successfully"));

        }else if (paymentMethod === "Online"){
            console.log("reached razorpay");
            generateRazorpayOrder(orderConfirm.orderId, total)
            .then((razorpayOrder)=>{
                return res
                .status(200)
                .json( new ApiResponse(200, {orderConfirm, razorpayOrder}, "Order placed successfully"));
            })
            .catch((error)=>{
                console.log(error);
                return res
                .status(500)
                .json( new ApiError(500, "Something went wrong", error));
            })            
        }else if(paymentMethod === "Wallet"){

            const updateOrder = await Order.updateOne(
                {
                    _id: orderConfirm._id
                },
                {
                    $set: {
                        status: "Placed",
                        paymentStatus: "Paid"
                    }
                }
            )
            if(!updateOrder.modifiedCount){
                return res
                .status(500)
                .json( new ApiError(500, "Order payment status not updated server error"));
            }
            await Cart.deleteMany({user_id: user._id});
            return res
            .status(200)
            .json( new ApiResponse(200, {orderConfirm , wallet:true}, "Order placed successfully"));
        }
    } catch(error){
        console.log(error)
        res
        .status(400)
        .json( new ApiError(400, "Something went wrong", error))
    }
});

const orderSuccessPage = asyncHandler( async(req,res)=>{
    //forlayout
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


    const id = req.params.id;
    const order = await Order.findOne({_id: id});
    const addressArray = await Address.find({_id: order.address });
    const address = addressArray[0]
    let discount = 0;
    let totalAmount = order.orderAmount;    
    if(order.couponCode){
        //const coupon = await Coupon.findOne({code: order.couponCode});
        //discount = coupon.discount
        discount = order.couponDiscount
        totalAmount = order.orderAmount + discount;
    }
    if(order.deliveryCharge){
        totalAmount = totalAmount - order.deliveryCharge;
    }

    if(!order){
        throw new ApiError(404, "Order not found")
    }
    

    res
    .status(200)
    .render("users/successpage",{title:"Urbane Wardrobe", user: req.user, order, address, discount, totalAmount, categorylayout, wishlistCountlayout, cartCountlayout});
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
            },
            {
                $sort: {
                    createdAt: -1
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
    for (const order of orderVarients) {   
        try {
          const offer = await checkOffer(order.productVarient.product.category?.category);
    
          if (offer) {
            order.productVarient.originalPrice = order.productVarient.price;    
            order.productVarient.price = applyOffer(order.productVarient.price, offer.discount);
            order.offerApplied = true;
          }

        } catch (error) {          
          console.error("Error checking offer:", error);
        }    
        subTotal += order.productVarient.price * order.orderedItems.quantity;
    }
    const coupon = await Coupon.findOne({code: order.couponCode});

    let total = parseInt(subTotal);
    if (coupon) {
        total = parseInt(subTotal) - parseInt(coupon.discount); 
    }
    total = total + parseInt(order.deliveryCharge);

    if (order.status === "Delivered") {
        order.delivered = true;
    }
    console.log("This is order", order)
    
    res
    .status(200)
    .render("admin/orderdetails",{admin:true, title:"Urbane Wardrobe", order, orderVarients, subTotal, total, coupon});
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
    if (status === "Delivered") {
        console.log("entered delivered condition")
        const order = await Order.updateOne(
            {
                _id: orderId
            },
            {
                $set: {
                    returnPeriod : true,
                    paymentStatus: "Paid"
                }
            }
        );    
        
        console.log("updated order", order)
    }
    const updatedOrder = await Order.findOne({_id: orderId})
    console.log("this is updated order",updatedOrder)

    if(!order){
        return res
        .status(400)
        .json(new ApiResponse(400, null, "Something went wrong"));        
    }

    res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated"));
});

const renderUserOrdersPage = asyncHandler( async(req,res)=>{    
    const userId = req.user._id;    
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
    
    const order = await Order.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
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
                            _id: 1,
                            fullname: 1,
                            phone: 1,
                            email: 1
                        }
                    }
                ]
            }
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
                            type: 1,
                            fullname: 1,
                            phone: 1,
                            street: 1,
                            locality: 1,
                            district: 1,
                            state: 1,
                            pincode: 1
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
                                                    category: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        name: 1,
                                        category: { $first: "$category.category" }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "sizes",
                            localField: "size_id",
                            foreignField: "_id",
                            as: "size",
                            pipeline: [
                                {
                                    $project: {
                                        size: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "colors",
                            localField: "color_id",
                            foreignField: "_id",
                            as: "color",
                            pipeline: [
                                {
                                    $project: {
                                        color: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            product: { $first: "$product" },
                            images: 1,
                            price: 1,
                            size: { $first: "$size.size" },
                            color: { $first: "$color.color" },
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
                quantity: "$orderedItems.quantity",
            }
        },
        {
            $group: {
                _id: {
                    userId: "$userId",
                    _id: "$_id",
                    user: "$user",
                    address: "$address",
                    status : "$status",
                    orderId: "$orderId",
                    orderAmount: "$orderAmount",
                    paymentMethod: "$paymentMethod",
                    createdAt: "$createdAt",
                    size: "$orderedItems.size",
                    color: "$orderedItems.color",
                    //quantity: "$quantity",
                    returnPeriod: "$returnPeriod"
                }, 
                user: { $first: "$user" },
                address: { $first: "$address" },            
                orderedItems: { $push: "$productVarient" } // Consolidate productVariant fields into a single array
            }
        },
        {
            $project: {
                _id: "$_id._id",
                userId: "$_id.userId",
                user: { $arrayElemAt: ["$user", 0] },
                address: { $arrayElemAt: ["$address", 0] },
                orderedItems: 1,
                status: "$_id.status",
                orderId: "$_id.orderId",
                orderAmount: "$_id.orderAmount",
                paymentMethod: "$_id.paymentMethod",
                createdAt: "$_id.createdAt",
                size: "$_id.size",
                color: "$_id.color",
                quantity: "$_id.quantity",
                returnPeriod: "$_id.returnPeriod"
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    order.forEach((order)=>{
        const formattedCreatedAt = order.createdAt.toISOString().split('T')[0];
        order.createdAt = formattedCreatedAt;        
    });

    console.log("This is order data", order)
    res
    .status(200)
    .render("users/orderlist",{user: req.user, title:"Urbane Wardrobe", order, layout: "userprofilelayout", wishlistCountlayout, categorylayout, cartCountlayout});
});

const cancelOrder = asyncHandler( async(req,res)=>{
    const orderId = req.body.orderId;
    const order = await Order.updateOne(
        {
            _id: orderId
        },
        {
            $set: {
                status: "cancelled"
            }
        }
    );
    

    if(!order){
        return res
        .status(400)
        .json(new ApiResponse(400, "Something went wrong"));        
    }
    
    res
    .status(200)
    .json(new ApiResponse(200, null, "Order cancelled successfully"));
});

const renderUserOrderDetailsPage = asyncHandler( async(req,res)=>{
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
   
    for (const order of orderVarients) {
        console.log("This is inside the loop:", order.productVarient.product.category?.category);    
        try {
          const offer = await checkOffer(order.productVarient.product.category?.category);
    
          if (offer) {
            order.productVarient.originalPrice = order.productVarient.price;    
            order.productVarient.price = applyOffer(order.productVarient.price, offer.discount);
            order.offerApplied = true;
            console.log("Price after applying offer:", order.productVarient.price);
          }

        } catch (error) {          
          console.error("Error checking offer:", error);
        }    
        subTotal += order.productVarient.price * order.orderedItems.quantity;
        console.log("This is subtotal", subTotal)
    }
    const coupon = await Coupon.findOne({code: order.couponCode});

    let total = parseInt(subTotal);    
    if (coupon) {
        total = parseInt(subTotal) - parseInt(coupon.discount); 
    }
    total = total + parseInt(order.deliveryCharge);

    if (order.status === "Delivered") {
        order.delivered = true;
    }
    console.log("this is total", total);
    console.log("Thisis order", order);
    
    res
    .status(200)
    .render("users/orderdetails",{user:req.user, title:"Urbane Wardrobe", order, orderVarients, subTotal, total, coupon, layout: "userprofilelayout", wishlistCountlayout, cartCountlayout, categorylayout});
});

const verifyPayment = asyncHandler( async(req,res)=>{
    console.log("Entered verify payment");
    
    const {response, order, payLater} = req.body;
    let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);

    hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
    hmac = hmac.digest('hex');

    if (hmac == response.razorpay_signature) {
        let order1 = await  Order.updateOne({ _id: order._id }, {$set: { paymentStatus: "Paid", status:"Placed" }});
        if(!order1){
            return res
            .status(400)
            .json(new ApiError(400, "Couldnt update order database but payment is successful"));
        }
        if(!payLater){
            await Cart.deleteMany({user_id: req.user._id});
        }
        res
        .status(200)
        .json(new ApiResponse(200, {order : order1}, "Payment verified successfully"));

    } else {
        res
        .status(400)
        .json(new ApiError(400, "Something went wrong"));        
    }
});

const returnOrder = asyncHandler( async(req,res)=>{
    const orderId = req.body.orderId;
    console.log("Entered return wiht order id", orderId);    
    const order = await Order.findOne({ _id: orderId });
    if(!order){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the order"));
    }
    order.returnPeriod = false;
    order.status = "Returned";
    await order.save();    
    
    if (order.paymentStatus === "Paid") {
        const wallet = await Wallet.updateOne(
            {
                userId: order.userId
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
        
        if (wallet.modifiedCount === 1 || Wallet.upsertedCount === 1) {            
            const updatedOrder = await Order.updateOne(
                {
                    _id: order._id
                },
                {
                    $set: {
                        paymentStatus : "Refunded"                    
                    }
                }
            )
        }
    }
    return res.status(200).json(new ApiResponse(200, null, "Order returned successfully"));
});

const renderInvoice = asyncHandler( async(req,res)=>{
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


    const orderId = req.params.id;
    const order = await Order.findOne({ orderId: orderId }).populate("userId").populate("address");
    if(!order){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the order"));
    }
    const products = await Order.aggregate([
        {
            $match: {
                _id: order._id
            }
        },
        {
            $unwind: "$orderedItems"
        },
        {
            $project: {
                "orderedItems": 1
            }
        },
        {
            $lookup: {
                from: "productvarients",
                localField: "orderedItems.productVarientId",
                foreignField: "_id",
                as: "productvarient",
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
                                        as: "category"
                                    }
                                },
                                {
                                    $addFields: {
                                        category: {
                                            $arrayElemAt: [ "$category", 0 ]
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            product: {
                                $arrayElemAt: [ "$product", 0 ]
                            }
                        }
                    }
                ]
            }
        },
            {
                    
                $addFields: {
                            productvarient: {
                                $arrayElemAt: [ "$productvarient", 0 ]
                        }
            }
        }
    
    ]);

    for (const prod of products) {
        console.log("This is inside the loop:", prod.productvarient.product.category?.category);    
        try {
          const offer = await checkOffer(prod.productvarient.product.category?.category);
    
          if (offer) {
            prod.productvarient.originalPrice = prod.productvarient.price;    
            prod.productvarient.price = applyOffer(prod.productvarient.price, offer.discount);
            prod.offerApplied = true;
            console.log("Price after applying offer:", prod.productvarient.price);
          }

        } catch (error) {          
          console.error("Error checking offer:", error);
        }    
    }
    console.log("invboice page  prodcuts", products, "thus us order" ,order)
    res
    .status(200)
    .render("users/invoice",{user: req.user, title:"Urbane Wardrobe", order, products, wishlistCountlayout, categorylayout, cartCountlayout});
});

const addWalletMoney = asyncHandler( async(req,res)=>{
    const { amount } = req.body;
    const transactionId = generateOrderId();
    generateRazorpayOrder(transactionId, amount)
    .then((razorpayOrder)=>{
        return res
        .status(200)
        .json( new ApiResponse(200, {transactionId, razorpayOrder}, "Money added to wallet successfully"));
    })
    .catch((error)=>{
        console.log(error);
        return res
        .status(500)
        .json( new ApiError(500, "Something went wrong", error));
    })

});

const verifyTransfer = asyncHandler( async(req,res)=>{    
    const {response, razorpayOrder, order} = req.body;
    console.log("RThis is respomse ", razorpayOrder)
    let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);

    hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
    hmac = hmac.digest('hex');

    if (hmac == response.razorpay_signature) {
        console.log("Entered verified condition");
        const wallet = await Wallet.updateOne(
            {
                userId: req.user._id
            },
            {
                $inc: {
                    balance: razorpayOrder.amount/100
                },
                $push: {
                    transactions: { amount: razorpayOrder.amount/100 , type: "deposit", date: Date.now() }
                }
            },
            {
                upsert: true
            }
        ) 

        if (wallet.modifiedCount===0 && wallet.upsertedCount===0) {
            throw new ApiError(500, "Failed to update wallet");        
        }

        res
        .status(200)
        .json(new ApiResponse(200, {razorpayOrder}, "Payment verified successfully"));

    } else {
        res
        .status(400)
        .json(new ApiError(400, "Something went wrong"));        
    }
});

const renderInvoiceAdmin = asyncHandler( async(req,res)=>{
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId }).populate("userId").populate("address");
    if(!order){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the order"));
    }
    const products = await Order.aggregate([
        {
            $match: {
                _id: order._id
            }
        },
        {
            $unwind: "$orderedItems"
        },
        {
            $project: {
                "orderedItems": 1
            }
        },
        {
            $lookup: {
                from: "productvarients",
                localField: "orderedItems.productVarientId",
                foreignField: "_id",
                as: "productvarient",
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
                                        as: "category"
                                    }
                                },
                                {
                                    $addFields: {
                                        category: {
                                            $arrayElemAt: [ "$category", 0 ]
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            product: {
                                $arrayElemAt: [ "$product", 0 ]
                            }
                        }
                    }
                ]
            }
        },
            {
                    
                $addFields: {
                            productvarient: {
                                $arrayElemAt: [ "$productvarient", 0 ]
                        }
            }
        }
    
    ]);

    for (const prod of products) {
        console.log("This is inside the loop:", prod.productvarient.product.category?.category);    
        try {
          const offer = await checkOffer(prod.productvarient.product.category?.category);
    
          if (offer) {
            prod.productvarient.originalPrice = prod.productvarient.price;    
            prod.productvarient.price = applyOffer(prod.productvarient.price, offer.discount);
            prod.offerApplied = true;
            console.log("Price after applying offer:", prod.productvarient.price);
          }

        } catch (error) {          
          console.error("Error checking offer:", error);
        }    
    }

    res
    .status(200)
    .render('users/invoice', { title:"Urbane Wardrobe", order, products});
});

const payLater = asyncHandler( async(req,res)=>{
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId }).populate("userId");
    if(!order){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the order"));
    }
    const transactionId = generateOrderId();
    generateRazorpayOrder(transactionId, order.orderAmount)
    .then((razorpayOrder)=>{
        return res
        .status(200)
        .json( new ApiResponse(200, {transactionId, razorpayOrder, order}, "Order for pay later made successfully"));
    })
    .catch((error)=>{
        console.log(error);
        return res
        .status(500)
        .json( new ApiError(500, "Something went wrong", error));
    })
});

const calcDelCharge = asyncHandler( async(req,res)=>{
    const {addressId} = req.body;

    const deliveryAddress = await Address.findOne({_id: addressId})
    let pincode = deliveryAddress.pincode;
    pincode = pincode.toString();        
    let distance = await calculateDistance("673639", pincode);
    console.log("this is the distance", distance);

    deliveryCharge = calculateDeliveryCharge(distance);
    res
    .status(200)
    .json( new ApiResponse(200, deliveryCharge, "successfully calculated delivery charge"))
});



module.exports = {
    checkOutPage,
    createOrder,
    orderSuccessPage,
    renderOrdersPage,
    renderOrderDetailsPage,
    changeOrderStatus,
    renderUserOrdersPage,
    cancelOrder,
    renderUserOrderDetailsPage,
    verifyPayment,
    returnOrder,
    renderInvoice,
    addWalletMoney,
    verifyTransfer,
    renderInvoiceAdmin,
    payLater,
    calcDelCharge
}