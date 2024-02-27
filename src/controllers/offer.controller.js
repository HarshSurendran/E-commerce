const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

//require models
const Offer = require("../models/offer.models.js");

const renderOffersPage = asyncHandler( async(req,res)=>{
    const offers = await Offer.find({});
    res
    .status(200)
    .render("admin/offer", {admin:true, title:"Urbane Wardrobe", offers})
})

const addOffersPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("admin/addoffer", {admin:true, title:"Urbane Wardrobe"})
})

module.exports = {
    renderOffersPage,
    addOffersPage
}