const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const uploadOnCloudinary = require("../utils/cloudinary");

//require models
const Offer = require("../models/offer.models.js");
const Category = require("../models/category.models.js");
const Wishlist = require("../models/wishlist.models.js");
const Cart = require("../models/cart.models.js");

const path = require("path");

const renderOffersPage = asyncHandler( async(req,res)=>{
    const offers = await Offer.find({}).populate("category");
    //const category = await Category.find({});
    //console.log(category)
    res
    .status(200)
    .render("admin/offer", {admin:true, title:"Urbane Wardrobe", offers})
})

const addOffersPage = asyncHandler( async(req,res)=>{
    const category = await Category.find({});
    res
    .status(200)
    .render("admin/addoffer", {admin:true, title:"Urbane Wardrobe",category})
});

const addOffers = asyncHandler( async(req,res)=>{
    const {name,description,discount, category, expirydate} = req.body;
    console.log("credentials for add offer", req.body);
    console.log(req.file);
    const categoryId = await Category.findOne({category});

    if(!req.file){
        throw new ApiError(400,"The image path is null")
    }
    
    const uploadedToCloudinary = await uploadOnCloudinary(req.file.path);
    
    if(!uploadedToCloudinary){
        throw new ApiError(500,`Error in uploading file number ${ind}`)
    }

    const banner = uploadedToCloudinary.url;
    

    const offer = await Offer.create({
        name,
        description,
        discount,
        category: categoryId._id,
        expirydate,
        banner
    })

    if(!offer){
        throw new ApiError(500,"Error in adding offer")
    }

    res
    .status(200)
    .redirect("/api/v1/admin/offers");
});

const deleteOffer = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    const deleted = await Offer.deleteOne({_id:id});
    console.log("This is delete offer",deleted)
    if (!deleted) {
        res
        .status(500)
        .redirect("/api/v1/admin/offers");
    }

    res
    .status(200)
    .redirect("/api/v1/admin/offers");
});

function applyOffer(price, discount){
    price = parseInt(price);
    discount = parseInt(discount);
    discountedAmount = (price - (price * (discount/100)));
    discountedAmount = Math.ceil(discountedAmount);
    return discountedAmount   
}
async function checkOffer(category){
    const categoryId = await Category.findOne({category});
    if (!categoryId) {
        return false        
    }
    const offer = await Offer.findOne({category: categoryId._id});
    if(!offer){
        return false
    }
    return offer
}

const renderUserOffersPage = asyncHandler( async(req,res)=>{
    //layout data
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
    //end layout data

    const offers = await Offer.find({}).populate("category");
    if (!offers) {
        const message = "Unfortunately, We don't have any offers right now!"
        res
        .status(500)
        .render("user/offers", {user: req.user, title:"Urbane Wardrobe", message, categorylayout, wishlistCountlayout, cartCountlayout})
    }

    res
    .status(200)
    .render("users/offerslist", {user: req.user, title:"Urbane Wardrobe", offers, categorylayout, wishlistCountlayout, cartCountlayout})
})

module.exports = {
    renderOffersPage,
    addOffersPage,
    addOffers,
    deleteOffer,
    applyOffer,
    checkOffer,
    renderUserOffersPage
}