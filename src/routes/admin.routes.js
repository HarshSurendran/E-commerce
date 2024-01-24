const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controler.js")
const productController = require("../controllers/product.controler.js");
const categoryController = require("../controllers/category.controler.js");
const colorController = require("../controllers/color.controler.js");
const sizeController = require("../controllers/size.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");


router.post("/login", adminController.adminlogin);

// Secured routes
router.post("/products", auth.verifyAdminJWT, productController.addProduct);
router.post("/products-varient", auth.verifyAdminJWT, upload.array("images",4), productController.addProductVarient);
router.post("/logout", auth.verifyAdminJWT, adminController.adminlogout);

//category
router.post("/category", auth.verifyAdminJWT, categoryController.addCategory);
//Color
router.post("/color", auth.verifyAdminJWT, colorController.addColor);
router.post("/c/:id", auth.verifyAdminJWT, colorController.deleteColor);
//Size
router.post("/size", auth.verifyAdminJWT, sizeController.addSize);
router.get("/size/:id", auth.verifyAdminJWT, sizeController.deleteSize);

module.exports = router;