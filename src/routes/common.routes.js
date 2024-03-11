const express = require("express");
const router = express.Router();
const commonController = require("../controllers/common.controller.js");
const userController = require("../controllers/user.controler.js");
const auth = require("../middlewares/auth.middleware.js");


router.get("/", auth.checkUserJWT, commonController.renderHomePage);

router.post("/signup", userController.loginUser);

router.get("/login", auth.checkUserJWT, commonController.renderLoginPage);

router.get("/register", auth.checkUserJWT, commonController.renderRegisterPage);

router.get("/productdetails/:id", commonController.productDetailsPage);

router.get("/productlist", commonController.listProducts);

router.post("/checkemail", commonController.checkEmail);

router.post("/checkphone", commonController.checkPhone);

router.post("/verifyotp", userController.verifyOtp, commonController.changePasswordPage)


module.exports = router