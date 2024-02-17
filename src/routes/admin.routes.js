const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controler.js")
const productController = require("../controllers/product.controler.js");
const categoryController = require("../controllers/category.controler.js");
const colorController = require("../controllers/color.controler.js");
const sizeController = require("../controllers/size.controler.js");
const orderController = require("../controllers/order.controller.js");
const upload = require("../middlewares/multer.middleware.js");
const auth = require("../middlewares/auth.middleware.js");



const  mongoose  = require("mongoose");
const Order = require("../models/order.models.js");
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
})



//did some graph logic here

router.post("/salesData", async (req,res)=>{
    const { filter, time } = req.body
    if (filter === "weekly") {
        salesData.labels = ["week1", "week2", "week3", "week4", "week5"];
        const sales = await Order.aggregate([
            {
                $match: {
                    $month: time
                }
            },
            {
                $group: {
                    _id: {
                            $month: "$createdAt"
                    },
                    revenueData: {
                        $sum: 1
                    }
                }
            }
        ])
        console.log(sales);
    }else if(filter === "monthly"){
        salesData.labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const contraints = {
            $gte: new Date(`${time-1}-01-01T00:00:00.000Z`),
            $lte: new Date(`${time}-12-31T00:00:00.000Z`)            
        }
        const sales = await Order.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                            $month: "$createdAt"
                    },
                    revenueData: {
                        $sum: "$orderAmount"
                    },
                    salesData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    createdAt: {
                        $month: 1
                    }
                }
            }
        ])
        console.log(sales);
    }else{
        salesData.labels = [`${time-10}`, `${time-9}`, `${time-8}`, `${time-7}`, `${time-6}`, `${time-5}`, `${time-4}`, `${time-3}`, `${time-2}`, `${time-1}`, `${time}`];
        const contraints = {
            $gte: new Date(`${time-10}-01-01T00:00:00.000Z`),
            $lte: new Date(`${time}-12-31T00:00:00.000Z`)            
        }
        const sales = await Order.aggregate([
            {
                $match: {
                    createdAt: contraints
                }
            },
            {
                $group: {
                    _id: {
                        $month: "$createdAt"
                    },
                    revenueData: {
                        $sum: "$orderAmount"
                    },
                    salesData: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    createdAt: {
                        $year: 1
                    }
                }
            }
        ])
        console.log(sales);
    }
    
    

   
    // const salesData1 = await Order.find({createdAt: {$gte: new Date("2024-02-11T00:00:00.000Z"), $lte: new Date("2024-02-12T00:00:00.000Z")}})
    // console.log("This is salesrepotty for ", salesData1);

    let salesData = 
        {
            "labels": ["Jan", "Feb", "Mar", "Apr"],
            "salesData": [18, 17, 4, 3, 2, 20, 25, 31, 25, 22, 20, 9],
            "revenueData": [40, 20, 17, 9, 23, 35, 39, 30, 34, 25, 27, 17],
            "productsData": [30, 10, 27, 19, 33, 15, 19, 20, 24, 15, 37, 6]
        }
    
    res.json(salesData)
})






// router.get("/test",(req,res)=>{
//     res.render("admin/userdetails",{admin:true});
// });


// order
router.get("/orders/orderdetails/:id", orderController.renderOrderDetailsPage);
router.get("/orders", orderController.renderOrdersPage);
router.post("/updateorderstatus", orderController.changeOrderStatus);

// login
router.get("/", auth.checkAdminJWT , adminController.renderLoginPage);
router.post("/", adminController.adminlogin);
router.post("/verify", adminController.verifyEmailPassword);
router.get("/dashboard", auth.verifyAdminJWT, adminController.renderDashboard);


// product handling 
router.get("/Products", auth.verifyAdminJWT, productController.onlyProductsList);
router.get("/products/addproduct", auth.verifyAdminJWT, productController.addProductPage);
router.post("/addproduct", auth.verifyAdminJWT, productController.addProduct);
router.get("/products/edit-product/:id", auth.verifyAdminJWT, productController.editProductPage);
router.post("/editProduct", auth.verifyAdminJWT, productController.editProduct);
//router.get("/delete-product/:id", auth.verifyAdminJWT, productController.deleteProduct); delete product is not needed.
router.get("/productlist", auth.verifyAdminJWT, productController.listProducts);
router.get("/products/products-varient", auth.verifyAdminJWT, productController.addProductVarientPage);
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