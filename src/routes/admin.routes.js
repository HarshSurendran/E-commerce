const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controler.js")
const productController = require("../controllers/product.controler.js");
const categoryController = require("../controllers/category.controler.js");
const colorController = require("../controllers/color.controler.js");
const sizeController = require("../controllers/size.controler.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");


// login
router.get("/", auth.checkAdminJWT , adminController.renderLoginPage);
router.post("/", adminController.adminlogin);
router.post("/verify", adminController.verifyEmailPassword);
router.get("/dashboard", auth.verifyAdminJWT, adminController.renderDashboard);


// product handling 
router.get("/Products", auth.verifyAdminJWT, productController.onlyProductsList);
router.get("/addproduct", auth.verifyAdminJWT, productController.addProductPage);
router.post("/addproduct", auth.verifyAdminJWT, productController.addProduct);
router.get("/edit-product/:id", auth.verifyAdminJWT, productController.editProductPage);
router.post("/editProduct", auth.verifyAdminJWT, productController.editProduct);
//router.get("/delete-product/:id", auth.verifyAdminJWT, productController.deleteProduct); delete product is not needed.
router.get("/productlist", auth.verifyAdminJWT, productController.listProducts);
router.get("/products-varient", auth.verifyAdminJWT, productController.addProductVarientPage);
router.post("/products-varient", auth.verifyAdminJWT, upload.array("images",4), productController.addProductVarient);
router.patch("/listunlist/:id", auth.verifyAdminJWT, productController.listUnlistProduct);

router.get("/test",(req,res)=>{
    res.render("admin/userdetails",{admin:true});
})

//user handling
router.patch("/blockunblock/:userId", auth.verifyAdminJWT, adminController.blockUnblockUser)
router.get("/users", auth.verifyAdminJWT, adminController.userList);
//router.get("/delete-user/:id", auth.verifyAdminJWT, adminController.deleteUser); Delete User is not necessary
router.get("/createuser", auth.verifyAdminJWT, adminController.createUserPage);
router.post("/createuser", auth.verifyAdminJWT, adminController.createUser); //we could have used insert user middleware

//category handling
router.get("/category", auth.verifyAdminJWT, categoryController.categoryPage);
router.post("/category", auth.verifyAdminJWT, categoryController.addCategory);
router.get("/delete-category/:id", auth.verifyAdminJWT, categoryController.deleteCategory);
router.patch("/category", auth.verifyAdminJWT, categoryController.editCategory);

//Color
router.post("/color", auth.verifyAdminJWT, colorController.addColor);
router.post("/c/:id", auth.verifyAdminJWT, colorController.deleteColor);
//Size
router.post("/size", auth.verifyAdminJWT, sizeController.addSize);
router.get("/size/:id", auth.verifyAdminJWT, sizeController.deleteSize);

// Secured routes
router.get("/logout", auth.verifyAdminJWT, adminController.logout);

module.exports = router;