const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asynchandler");
const Wallet = require("../models/wallet.models.js");
const Order = require("../models/order.models.js");
const Category = require("../models/category.models.js");
const Wishlist = require("../models/wishlist.models.js");
const Cart = require("../models/cart.models.js");

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
        throw new ApiError(400, "Wallet not found");        
    }

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
            }
        },
        {
            upsert: true
        }
    )
    console.log("this is wallet", wallet);
    if (wallet.modifiedCount===0) {
        throw new ApiError(500, "Failed to update wallet");        
    }
    next();
});

module.exports = {
    renderWalletPage,
    updateWallet
}