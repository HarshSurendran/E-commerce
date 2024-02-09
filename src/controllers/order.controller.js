const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
// require models
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Address = require("../models/address.models.js");
const Cart = require("../models/cart.models.js");
const Order = require("../models/order.models.js");

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
        console.log(req.body);
        
        function generateOrderId() {
            let orderId = Math.floor(10000000 + Math.random() * 90000000);
            return orderId;
        }
        const orderId = generateOrderId();
        console.log("This is generated order id",orderId);

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
        console.log("this is orderItems field",orderedItems);

        const order = await Order.create({
            userId: user._id,
            address,
            paymentMethod : payment,
            orderAmount: total,
            orderedItems,
            orderId
        })
        console.log("THis is order created", order);

        const orderConfirm = await Order.findOne({_id: order._id});

        console.log("This is order confirmed",orderConfirm);

        if(!orderConfirm){
            return res
            .status(500)
            .json(new ApiError(500, "Order not placed server error"));
        }

        await Cart.deleteMany({user_id: user._id});

        return res
        .status(200)
        .json( new ApiResponse(200, {orderConfirm}, "Order placed successfully"));
        

    } catch(error){
        console.log(error)
        res
        .status(400)
        .json( new ApiError(400, "Something went wrong"))
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
})

module.exports = {
    checkOutPage,
    createOrder,
    orderSuccessPage
}