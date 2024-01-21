const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controler.js");
const upload = require("../middlewares/multer.middleware.js")

router.post("/register", upload.single('image') , userController.registerUser)



module.exports = router