const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controler.js");
const productController = require("../controllers/product.controler.js");
const cartController = require("../controllers/cart.controller.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");
const insertUser = require("../middlewares/insertUser.middleware.js");
const otpGenerator = require("../middlewares/otpGenerator.middleware.js");
const verifyOtp = require("../middlewares/otpVerification.middleware.js");



// product related
router.get("/listproducts", auth.verifyUserJWT,  productController.listProducts);
router.get("/productdetails/:id", auth.verifyUserJWT,  productController.productDetailsPage);


router.post("/register", upload.single('image'), insertUser, otpGenerator, userController.otpPageLoader);
router.post("/verify-otp", verifyOtp, userController.verifiedUserLogin);
//router.post("/signup", userController.loginUser);
router.get("/home", auth.verifyUserJWT, userController.homePageRender)
//router.get("/product-list", userController.allproductlist)

// cart management
router.get("/cart", auth.verifyUserJWT, cartController.renderCartPage);
router.post("/cart", auth.verifyUserJWT, cartController.addToCart);
router.delete("/cart", auth.verifyUserJWT, cartController.deleteCart);

//secured route
router.get("/logout", auth.verifyUserJWT, userController.logoutUser);
router.post("/refresh-token",auth.verifyUserJWT, userController.refreshAccessToken);
router.patch("/userdetails", auth.verifyUserJWT, userController.updateUserDetails);
router.patch("/password", auth.verifyUserJWT, userController.changeCurrentPassword);
router.get('/getuser', auth.verifyUserJWT, userController.getCurrentUser);

module.exports = router;