const express = require("express");
const router = express.Router();
const commonController = require("../controllers/common.controller.js");


router.get("/", commonController.renderHomePage);

router.get("/login", commonController.renderLoginPage);

router.get("/register", commonController.renderRegisterPage);


module.exports = router