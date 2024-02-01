const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

// require Models
const Cart = require("../models/cart.models.js");
const ProductVarient = require("../models/productvarient.models.js");
const User = require("../models/user.models.js");
const { default: mongoose } = require("mongoose");
const { json } = require("express");

const addToCart = asyncHandler( async(req, res)=>{
    const user_id = req.user._id;
    const productVarient_id = req.body.productId;
    const quantity = req.body?.quantity;

    console.log( user_id,"userid and proid", productVarient_id);

    const cartAlreadyExist = await Cart.find({ user_id, productVarient_id})
    console.log("this  is cart a;ready exist",cartAlreadyExist)
    console.log("the length ", cartAlreadyExist.length);

    if(!(cartAlreadyExist.length === 0)){
        throw new ApiError(400,"Product already in cart");
    }

    const cart = await Cart.create({
        user_id,
        productVarient_id,
        quantity        
    });

    console.log(cart);

    if(!cart){
        throw new ApiError(500,"Something went wrong while adding to cart")
    }

    res
    .status(200)
    .json( new ApiResponse(200,{}, "Added to cart successfully"))

});

const renderCartPage = asyncHandler( async(req,res)=>{
    const user = req.user;
    console.log(user);
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
    
    let items = JSON.stringify(cart[0])
    console.log("this is cart items",items)
    
    res
    .status(200)
    .render("users/cartpage",{user: user , title:"Urbane Wardrobe", cart})
        
});

const deleteCart = asyncHandler( async(req,res)=>{
    const id = req.body.id;

    const deleteCart = await Cart.deleteOne({_id:id});
    console.log(deleteCart)
    
    res
    .status(200)
    .json( new ApiResponse(200,{},"Product deleted from cart"))

})

module.exports = {
    addToCart,
    renderCartPage,
    deleteCart
}