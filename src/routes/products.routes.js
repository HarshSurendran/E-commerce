const express = require("express");
const router = express.Router();
const commonController = require("../controllers/common.controller.js");
const userController = require("../controllers/user.controler.js");
const productController = require("../controllers/product.controler.js");
const auth = require("../middlewares/auth.middleware.js");
const verifyOtp = require("../middlewares/otpVerification.middleware.js");

router.get("/Mens", productController.menslistPage);

router.get("/Womens", productController.womenslistPage);

router.get("/Kids", productController.kidslistPage);

router.get("/listproducts", auth.verifyUserJWT,  productController.listProducts);

router.get("/productdetails/:id", auth.verifyUserJWT, productController.productDetailsPage);




module.exports = router