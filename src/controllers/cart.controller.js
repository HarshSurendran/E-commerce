const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

// require Models
const Cart = require("../models/cart.models.js");
const ProductVarient = require("../models/productvarient.models.js");
const User = require("../models/user.models.js");

const addToCart = asyncHandler( async(req, res)=>{
    const user_id = req.user._id;
    const productVarient_id = req.body.productId;
    const quantity = req.body?.quantity;

    

    console.log( user_id,"userid and proid", productVarient_id);

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

})

module.exports = {
    addToCart
}