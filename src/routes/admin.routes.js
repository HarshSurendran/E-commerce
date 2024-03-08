const express = require("express");
const router = express.Router();
//controllers
const adminController = require("../controllers/admin.controler.js")
const productController = require("../controllers/product.controler.js");
const orderController = require("../controllers/order.controller.js");
const couponController = require("../controllers/coupon.controller.js");
const offerController = require("../controllers/offer.controller.js");

const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");
//models
const Order = require("../models/order.models.js");
const Product = require("../models/product.models.js");

const  mongoose  = require("mongoose");
const ApiResponse = require("../utils/ApiResponse");


router.get("/test", async(req,res)=>{
    let orderid = "65c5d1f53510aa6449324293";
    console.log("this is id", new mongoose.Types.ObjectId(orderid));
    const order = await Order.aggregate(
    [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderid) // orderid
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id : 1,
                            fullname : 1,
                            phone : 1,
                            email: 1
                        }
                    }
                ]
            },
        },
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address",
                pipeline: [
                    {
                        
                        $project: {
                            type : 1,
                            fullname: 1,
                            phone: 1,
                            street: 1,
                            locality: 1,
                            district: 1,
                            state: 1,
                            pincode: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$orderedItems"
        },
        {
            $lookup: {
                from: "productvarients",
                localField: "orderedItems.productVarientId",
                foreignField: "_id",
                as: "productVarient",
                pipeline: [
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "categories",
                                        localField: "category",
                                        foreignField: "_id",
                                        as: "category",
                                        pipeline: [
                                            {
                                                $project: {
                                                    category : 1
                                                }
                                            }
                                        ]
                                    }
                                },                            
                                {                                       
                                    $project: {
                                        name : 1,
                                        category: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        category: { $first: "$category" }
                                    }
                                }                             
                            ]
                        }
                    },
                    {                        
                        $project: {
                            _id:1,
                            product: 1,
                            images:1,
                            price:1
                        }
                    },
                    {
                        $addFields: {
                            product: { $first: "$product" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                productVarient: {
                    $arrayElemAt: ["$productVarient", 0]
                },
                user: {
                    $arrayElemAt: ["$user", 0]
                },
                address: {
                    $arrayElemAt: ["$address", 0]
                }
            }
        }
    ]);
    // const order = await Order.findById(orderid);
    console.log("this is order ", order);
    res.json( new ApiResponse( 200, order, "Order details"))
});

//offer
router.get("/offers", auth.verifyAdminJWT, offerController.renderOffersPage);
router.get("/offers/add-offer", auth.verifyAdminJWT, offerController.addOffersPage);
router.post("/offers", auth.verifyAdminJWT, upload.single("images"), offerController.addOffers);
router.get("/offers/delete-offer/:id", auth.verifyAdminJWT, offerController.deleteOffer);

//sales Report
router.get("/salesreport", auth.verifyAdminJWT, adminController.renderSalesReportPage);
router.post("/salesreport", auth.verifyAdminJWT, adminController.getSalesReport);
router.post("/filtersalesreport", adminController.salesReportFilter);


//coupons
router.get("/coupons", auth.verifyAdminJWT, couponController.renderCouponPage);
router.post("/coupons", auth.verifyAdminJWT, couponController.addCoupon);
router.get("/delete-coupon/:id", auth.verifyAdminJWT, couponController.deleteCoupon);
router.get("/edit-coupon/:id", auth.verifyAdminJWT, couponController.editCouponPage);
router.post("/editcoupon", auth.verifyAdminJWT, couponController.editCoupon)

//graph
router.post("/graphData", auth.verifyAdminJWT, adminController.graphData);

//order
router.get("/orders/orderdetails/:id", orderController.renderOrderDetailsPage);
router.get("/orders", orderController.renderOrdersPage);
router.post("/updateorderstatus", orderController.changeOrderStatus);

//login
router.get("/", auth.checkAdminJWT , adminController.renderLoginPage);
router.post("/", adminController.adminlogin);
router.post("/verify", adminController.verifyEmailPassword);
router.get("/dashboard", auth.verifyAdminJWT, adminController.renderDashboard);


//product handling 
router.get("/Products", auth.verifyAdminJWT, productController.onlyProductsList);
router.get("/products/addproduct", auth.verifyAdminJWT, productController.addProductPage);
router.post("/addproduct", auth.verifyAdminJWT, productController.addProduct);
router.get("/products/edit-product/:id", auth.verifyAdminJWT, productController.editProductPage);
router.post("/editProduct", auth.verifyAdminJWT, productController.editProduct);
//router.get("/delete-product/:id", auth.verifyAdminJWT, productController.deleteProduct); delete product is not needed.
//router.get("/productlist", auth.verifyAdminJWT, productController.listProducts);
router.get("/products/products-varient", auth.verifyAdminJWT, productController.addProductVarientPage);
router.get("/products/products-varient/:name", auth.verifyAdminJWT, productController.addProductVarientPagewithId);
router.post("/products-varient", auth.verifyAdminJWT, upload.array("images",4), productController.addProductVarient);
router.patch("/listunlist/:id", auth.verifyAdminJWT, productController.listUnlistProduct);
router.post("/updatephoto", upload.any(), productController.uploadImage);
router.get("/products/editproductsvarient/:id", auth.verifyAdminJWT, productController.editProductVarientPage);
router.post("/products/editproductvarient", auth.verifyAdminJWT, productController.editProductVarient);
router.get("/products/productvarientdetails/:id", auth.verifyAdminJWT, productController.productVarientDetailsPage);



//user handling
router.patch("/blockunblock/:userId", auth.verifyAdminJWT, adminController.blockUnblockUser)
router.get("/users", auth.verifyAdminJWT, adminController.userList);
//router.get("/delete-user/:id", auth.verifyAdminJWT, adminController.deleteUser); Delete User is not necessary
router.get("/users/createuser", auth.verifyAdminJWT, adminController.createUserPage);
router.post("/createuser", auth.verifyAdminJWT, adminController.createUser); //we could have used insert user middleware
router.get("/users/details/:id",auth.verifyAdminJWT, adminController.userDetails);
router.patch("/editdetails", auth.verifyAdminJWT, adminController.editUserDetails);



//category handling
router.get("/category", auth.verifyAdminJWT, adminController.categoryPage);
router.post("/category", auth.verifyAdminJWT, adminController.addCategory);
router.get("/delete-category/:id", auth.verifyAdminJWT, adminController.deleteCategory);
router.patch("/category", auth.verifyAdminJWT, adminController.editCategory);

//Color
router.post("/color", auth.verifyAdminJWT, productController.addColor);
router.get("/color/:id", auth.verifyAdminJWT, productController.deleteColor);

//Size
router.post("/size", auth.verifyAdminJWT, productController.addSize);
router.get("/size/:id", auth.verifyAdminJWT, productController.deleteSize);

// Secured routes
router.get("/logout", auth.verifyAdminJWT, adminController.logout);

// invoice
router.get("/invoice/:id", auth.verifyAdminJWT, orderController.renderInvoiceAdmin);

module.exports = router;