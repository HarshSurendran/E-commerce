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

const crypto = require("crypto")

const mongoose = require("mongoose");
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

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
    const user = req.user
    const address = await Address.find({userid: user._id })
    console.log(address);

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

    let total = 0;
    cart.forEach(element => {
        total = total + (element.quantity * element.product.price)
    });

    // discount and shipping logic
    let discount = 0;
    let shipping = 100;
    

    res
    .status(200)
    .render("users/checkout",{title:"Urbane Wardrobe", address, total, discount, shipping , state})
});

const createOrder = asyncHandler( async(req,res)=>{
    try{
        const user = req.user;
        const {paymentMethod, address} = req.body;      

        const orderId = generateOrderId();
        let payment = paymentMethod.toLowerCase()

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


        let total = 0;
        let orderedItems = [];
        cart.forEach(element => {
            //push the product varient and quantitty to orderItems array
            orderedItems.push({productVarientId : element.productVarient_id ,quantity: element.quantity})
            total = total + (element.quantity * element.product.price)
        });
        

        const order = await Order.create({
            userId: user._id,
            address,
            paymentMethod : payment,
            orderAmount: total,
            orderedItems,
            orderId
        })

        const orderConfirm = await Order.findOne({_id: order._id});

        if(!orderConfirm){
            // return res
            // .status(500)
            // .json(new ApiError(500, "Order not placed server error"));
            throw new Error("Order not placed server error");
        }

        await Cart.deleteMany({user_id: user._id});

        //check payment method 
        if(payment==="cod"){
            return res
            .status(200)
            .json( new ApiResponse(200, {orderConfirm , codpayment:true}, "Order placed successfully"));

        }else{
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
        }


        // return res
        // .status(200)
        // .json( new ApiResponse(200, {orderConfirm}, "Order placed successfully"));
        

    } catch(error){
        console.log(error)
        res
        .status(400)
        .json( new ApiError(400, "Something went wrong", error))
    }
});

const orderSuccessPage = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    const order = await Order.findOne({_id: id});
    const addressArray = await Address.find({_id: order.address });
    const address = addressArray[0]

    console.log("This is address ", address);

    if(!order){
        throw new ApiError(404, "Order not found")
    }

    console.log("This is order",order);

    res
    .status(200)
    .render("users/successpage",{title:"Urbane Wardrobe", user: req.user, order, address})
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
});

const renderUserOrdersPage = asyncHandler( async(req,res)=>{
    
    const userId = req.user._id;    

    const order = await Order.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId) // Assuming orderid is the variable containing the order _id
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
                    quantity: "$quantity",
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

    //order is coming properly you have to render it to order details page
    // res
    // .status(200)
    // .json( new ApiResponse( 200, order, "Orders fetched"));

    order.forEach((order)=>{
        const formattedCreatedAt = order.createdAt.toISOString().split('T')[0];
        order.createdAt = formattedCreatedAt;        
    });

    console.log("this is orders", order);

    res
    .status(200)
    .render("users/orderlist",{user: req.user, title:"Urbane Wardrobe", order, layout: "userprofilelayout"});
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
    console.log("This is order",order);

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
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId });
    if(!order){
        return res
        .status(400)
        .json(new ApiResponse(400, "Something went wrong"));
    }
    res
    .status(200)
    .render("users/orderdetails",{user: req.user, title:"Urbane Wardrobe", order, layout: "userprofilelayout"});
});

const verifyPayment = asyncHandler( async(req,res)=>{
    
    const {response, order} = req.body;
    let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);

    hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
    hmac = hmac.digest('hex');

    if (hmac == response.razorpay_signature) {
        let order1 = await  Order.updateOne({ _id: order._id }, {$set: { paymentStatus: "paid" }});
        if(!order1){
            return res
            .status(400)
            .json(new ApiError(400, "Couldnt update order database but payment is successful"));
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
    // const order = await Order.updateOne(
    //     {
    //         _id: orderId
    //     },
    //     {
    //         $set: {
    //             returnPeriod: false,
    //             status: "returned"
    //         }
    //     }        
    // );
    const order = await Order.findOne({ _id: orderId });
    if(!order){
        return res
        .status(400)
        .json(new ApiError(400, "Cant find the order"));
    }
    order.returnPeriod = false;
    order.status = "returned";
    await order.save();
    console.log("asdfjklashdfjkhfjk :",order);
    //put the amount to wallet
    if (order.paymentStatus === "paid") {        
        const wallet = await Wallet.updateOne(
            {
                userId: order.userId
            },
            {
                $inc: {
                    balance: order.orderAmount
                }
            },
            {
                upsert: true
            }
        )
        console.log("this is wallet", wallet);
        // if (wallet.modifiedCount === 0) {
        //     return res
        //     .status(400)
        //     .json(new ApiError(400, "Couldnt add amount to wallet"));        
        // }
    }
    return res.status(200).json(new ApiResponse(200, null, "Order returned successfully"));        
    
})

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
    returnOrder
}