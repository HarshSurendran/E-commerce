const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controler.js");
const commonController = require("../controllers/common.controller.js");
const auth = require("../middlewares/auth.middleware.js");

router.get("/:category", auth.verifyUserJWT, productController.categoryListPage);

router.get("/list/all", auth.verifyUserJWT,  productController.listProducts);

router.get("/productdetails/:id", auth.verifyUserJWT, productController.productDetailsPage);

router.get("/addproduct", auth.verifyAdminJWT, productController.addProductPage);

module.exports = router