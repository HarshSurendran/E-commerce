const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller.js");
const userController = require("../controllers/user.controler.js");
const productController = require("../controllers/product.controler.js");
const cartController = require("../controllers/cart.controller.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");
const insertUser = require("../middlewares/insertUser.middleware.js");
const otpGenerator = require("../middlewares/otpGenerator.middleware.js");
const verifyOtp = require("../middlewares/otpVerification.middleware.js");
const getUserId = require("../middlewares/giveuserid.middleware.js");

router.get("/otp", (req,res)=>{
    res.render("users/otpvalidation",{user:true});
})




router.post("/register", upload.single('image'), insertUser, otpGenerator, userController.otpPageLoader);
router.post("/verify-otp", verifyOtp, userController.verifiedUserLogin);
router.post("/resendotp", otpGenerator, userController.resendotpsender);
//router.post("/signup", userController.loginUser);
//router.get("/product-list", userController.allproductlist)
router.post("/forgotpassword", getUserId, otpGenerator, userController.forgotPassOtpSender);
router.post("/changepassword", userController.changePassFromOtp);


router.get("/home", auth.verifyUserJWT, userController.homePageRender);

// product related


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


//user profile
router.get("/profile", auth.verifyUserJWT, (req,res)=>{
    console.log(req.user);   
    res.render("users/profile",{user:req.user, layout:"userprofilelayout"});
});
router.get("/address", auth.verifyUserJWT, addressController.addressPage);
router.post("/address", auth.verifyUserJWT, addressController.addAddress);
router.get("/addaddress", auth.verifyUserJWT, addressController.addAddressPage);
router.get("/editaddress/:id", auth.verifyUserJWT, addressController.editAddressPage);
router.post("/editaddress", auth.verifyUserJWT, addressController.editAddress)


router.get("/delete-user/:id", auth.verifyUserJWT, userController.deleteUser);
router.patch("/details", auth.verifyUserJWT, userController.updateUserDetails);
router.post("/profilepicture", auth.verifyAdminJWT, upload.single("avatar",1), userController.addProfilepicture);

module.exports = router;