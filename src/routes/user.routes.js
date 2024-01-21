const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const verifyJWT = require("../middlewares/auth.middleware.js")

router.post("/register", upload.single('image') , userController.registerUser);

router.post("/login", userController.loginUser);

//secured route
router.post("/logout", verifyJWT, userController.logoutUser);
router.post("/refresh-token", userController.refreshAccessToken);



module.exports = router