const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
// require modals
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Address = require("../models/address.models.js");
const Cart = require("../models/cart.models.js");

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
})

module.exports = {
    checkOutPage
}