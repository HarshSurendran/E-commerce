const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

const renderHomePage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("landingPage", {common:true , title: "Urbane Wardrobe"});
});

const renderLoginPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("userlogin", {common:true , title: "Urbane Wardrobe"});
});

const renderRegisterPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("userregister", {common:true , title:"urbane Wardrobe"});

});

module.exports= {
    renderHomePage,
    renderLoginPage,
    renderRegisterPage
}