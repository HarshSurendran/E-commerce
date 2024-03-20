const express = require("express");
const router = express.Router();

//require controllers
const addressController = require("../controllers/address.controller.js");
const userController = require("../controllers/user.controler.js");
const productController = require("../controllers/product.controler.js");
const cartController = require("../controllers/cart.controller.js");
const orderController = require("../controllers/order.controller.js");
const offerController = require("../controllers/offer.controller.js");

//require middlewares
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");
const insertUser = require("../middlewares/insertUser.middleware.js");
const otpGenerator = require("../middlewares/otpGenerator.middleware.js");


//routes starts
router.post("/register", upload.single('image'), insertUser, otpGenerator, userController.otpPageLoader);
router.post("/verify-otp", userController.verifyOtp, userController.verifiedUserLogin);
router.post("/resendotp", otpGenerator, userController.resendotpsender);
router.post("/forgotpassword", userController.getUserId, otpGenerator, userController.forgotPassOtpSender);
router.post("/changepassword", userController.changePassFromOtp);
router.get("/home", auth.verifyUserJWT, userController.homePageRender);

//coupons
router.post("/availablecoupons", auth.verifyUserJWT, userController.availableCoupons);

// cart management
router.get("/cart", auth.verifyUserJWT, cartController.renderCartPage);
router.post("/cart", auth.verifyUserJWT, cartController.addToCart);
router.delete("/cart", auth.verifyUserJWT, cartController.deleteCart);
router.patch("/cart", auth.verifyUserJWT, cartController.addQuantity);

//wishlist
router.get("/wishlist", auth.verifyUserJWT, userController.renderWishlist);
router.post("/wishlist", auth.verifyUserJWT, userController.addToWishlist);
router.delete("/wishlist", auth.verifyUserJWT, userController.deleteWishlist);

//secured route
router.get("/logout", auth.verifyUserJWT, userController.logoutUser);
router.post("/refresh-token",auth.verifyUserJWT, userController.refreshAccessToken);
router.patch("/userdetails", auth.verifyUserJWT, userController.updateUserDetails);
router.patch("/password", auth.verifyUserJWT, userController.changeCurrentPassword);
router.get('/getuser', auth.verifyUserJWT, userController.getCurrentUser);

//user profile
router.get("/profile", auth.verifyUserJWT, userController.renderProfilePage);
router.get("/delete-user/:id", auth.verifyUserJWT, userController.deleteUser);
router.patch("/details", auth.verifyUserJWT, userController.updateUserDetails);
router.post("/profilepicture", auth.verifyAdminJWT, upload.single("avatar",1), userController.addProfilepicture);

//user address
router.get("/address", auth.verifyUserJWT, addressController.addressPage);
router.post("/address", auth.verifyUserJWT, addressController.addAddress);
router.get("/addaddress", auth.verifyUserJWT, addressController.addAddressPage);
router.get("/editaddress/:id", auth.verifyUserJWT, addressController.editAddressPage);
router.post("/editaddress", auth.verifyUserJWT, addressController.editAddress);
router.post("/fetchaddaddress", auth.verifyUserJWT, addressController.fetchAddAddress);

//orders
router.get("/orders", auth.verifyUserJWT,  orderController.renderUserOrdersPage);
router.patch("/orders", auth.verifyUserJWT, userController.updateWallet, orderController.cancelOrder);
router.patch("/returnorders", auth.verifyUserJWT,  orderController.returnOrder);
router.get("/orders/:id", auth.verifyUserJWT,  orderController.renderUserOrderDetailsPage);

//checkout
router.post("/deliverycharge", auth.verifyUserJWT, orderController.calcDelCharge)
router.post("/checkout", auth.verifyUserJWT, orderController.checkOutPage);
router.get("/checkout", auth.verifyUserJWT, orderController.checkOutPage);
router.post("/orderplaced", auth.verifyUserJWT, orderController.createOrder);
router.get("/ordersuccess/:id", auth.verifyUserJWT, orderController.orderSuccessPage);
router.post("/verifyPayment", auth.verifyUserJWT, orderController.verifyPayment);

//pay later
router.post("/paylater", auth.verifyUserJWT, orderController.payLater);

//invoice
router.get("/invoice/:id", auth.verifyUserJWT, orderController.renderInvoice);

//wallet
router.get("/wallet", auth.verifyUserJWT, userController.renderWalletPage);
router.post("/wallet", auth.verifyUserJWT, orderController.addWalletMoney);
router.post("/verifyTransfer", auth.verifyUserJWT, orderController.verifyTransfer);
router.post("/walletbalance", auth.verifyUserJWT, userController.getWalletBalance);

//offers 
router.get("/offers", auth.verifyUserJWT, offerController.renderUserOffersPage);

//filters
router.get("/filter/price/:min/:max", auth.verifyUserJWT , productController.filterByPrice);
router.get("/filter/color/:color", auth.verifyUserJWT, productController.filterByColor);

module.exports = router;