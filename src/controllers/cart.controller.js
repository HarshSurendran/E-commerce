const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

// require Models
const Cart = require("../models/cart.models.js");
const ProductVarient = require("../models/productvarient.models.js");
const User = require("../models/user.models.js");
const { default: mongoose } = require("mongoose");
const { json } = require("express");
const Category = require("../models/category.models.js");
const Wishlist = require("../models/wishlist.models.js");


const { applyOffer, checkOffer } = require("./offer.controller.js");

const addToCart = asyncHandler( async(req, res)=>{
    const user_id = req.user._id;
    const productVarient_id = req.body.productId;
    const quantity = req.body?.quantity;

    console.log( user_id,"userid and proid", productVarient_id);

    const cartAlreadyExist = await Cart.find({ user_id, productVarient_id})    

    if(!(cartAlreadyExist.length === 0)){
        throw new ApiError(400,"Product already in cart");
    }

    const cart = await Cart.create({
        user_id,
        productVarient_id,
        quantity        
    });

    console.log(cart);

    const cartCount = await Cart.find({user_id}).count();
    console.log("This is cart count ",cartCount);
    
    if(!cart){
        throw new ApiError(500,"Something went wrong while adding to cart")
    }

    res
    .status(200)
    .json( new ApiResponse(200,{cartCount}, "Added to cart successfully"))

});

const renderCartPage = asyncHandler( async(req,res)=>{
    const user = req.user;    
    //layout data
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
    //layout data end    

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
    console.log("This is cart",cart);
    
    res
    .status(200)
    .render("users/cartpage",{user: user , title:"Urbane Wardrobe", cart, total, categorylayout, wishlistCountlayout, cartCountlayout});
});

const deleteCart = asyncHandler( async(req,res)=>{
    const id = req.body.id;

    const deleteCart = await Cart.deleteOne({_id:id});
    console.log(deleteCart)
    
    res
    .status(200)
    .json( new ApiResponse(200,{},"Product deleted from cart"))

});

const addQuantity = asyncHandler( async(req,res)=>{
    const {id, quantity} = req.body;
    console.log(req.body);
    const cart = await Cart.findOne({_id: id}).populate("productVarient_id");
    
    if (cart.productVarient_id.stock < quantity) {
        console.log("Entered stock limit")
        return res
        .status(500)
        .json( new ApiResponse(500,"Stock exceeded. Try with lesser quantity"));
    }

    const updateCart = await Cart.updateOne(
        {
            _id: id
        },
        {
            $set: {
                quantity
            }
        },
        {
            new: true
        }
    );

    if(updateCart.modifiedCount === 0){
        console.log("entered error");
        return res
        .status(500)
        .json( new ApiResponse(500,"Server couldn't update cart"))
    }
    
    return res
    .status(200)
    .json( new ApiResponse(200,{updateCart},"Cart updated"))
})

module.exports = {
    addToCart,
    renderCartPage,
    deleteCart,
    addQuantity
}