const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js")

router.post("/register", upload.single('image') , userController.registerUser);
router.post("/login", userController.loginUser);

//secured route
router.post("/logout", auth.verifyUserJWT, userController.logoutUser);
router.post("/refresh-token",auth.verifyUserJWT, userController.refreshAccessToken);
router.patch("/userdetails", auth.verifyUserJWT, userController.updateUserDetails);
router.patch("/password", auth.verifyUserJWT, userController.changeCurrentPassword);
router.get('/getuser', auth.verifyUserJWT, userController.getCurrentUser);

module.exports = router