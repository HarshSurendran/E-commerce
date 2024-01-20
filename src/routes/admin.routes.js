const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controler.js");
const upload = require("../middlewares/multer.middleware.js");


router.post("/products", upload.array("image",4), productController.addProduct)


module.exports = router;