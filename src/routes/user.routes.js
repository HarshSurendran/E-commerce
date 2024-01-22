const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js")

router.post("/register", upload.single('image') , userController.registerUser);

router.post("/login", userController.loginUser);

//secured route
router.post("/logout", auth.verifyUserJWT, userController.logoutUser);
router.post("/refresh-token", userController.refreshAccessToken);
router.patch("/userdetails", auth.verifyUserJWT, userController.updateUserDetails);

module.exports = router