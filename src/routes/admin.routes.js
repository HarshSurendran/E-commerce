const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controler.js");
const categoryController = require("../controllers/category.controler.js");
const colorController = require("../controllers/color.controler.js");
const sizeController = require("../controllers/size.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");




// Secured routes
router.post("/products", productController.addProduct);
router.post("/products-varient", upload.array("images",4), productController.addProductVarient);

//category
router.post("/category", categoryController.addCategory);
//Color
router.post("/color", colorController.addColor);
//Size
router.post("/size", sizeController.addSize);

module.exports = router;