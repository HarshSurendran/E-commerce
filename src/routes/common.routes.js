const express = require("express");
const router = express.Router();
const commonController = require("../controllers/common.controller.js");

router.get("/test", (req,res)=>{
    res.render("test");
})
router.get("/", commonController.renderHomePage);

router.get("/login", commonController.renderLoginPage);

router.get("/register", commonController.renderRegisterPage);

router.get("/product", (req,res)=>{
    res.render("productdetails", {user:true , title:"Urbane Wardrobe"});
})


module.exports = router