const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

//models
const ProductVarient = require("../models/productvarient.models.js");
const Color = require("../models/color.model.js");
const Category = require("../models/category.models.js");
const Cart = require("../models/cart.models.js");
const Wishlist = require("../models/wishlist.models.js");

const { checkOffer, applyOffer } = require("./offer.controller");
const { default: mongoose } = require("mongoose");


const filterByPrice = asyncHandler(async (req, res) => {
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //colors for filter options
    const colors = await Color.find({}).select("-createdAt -updatedAt -hex");

    let { min, max } = req.params;    
    min = parseInt(min);
    max = parseInt(max);

    const product = await ProductVarient.aggregate(
        [   
            {
                $match: {
                    price: {
                        $gte: min,
                        $lte: max,
                    }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
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
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1
                }
            }
        ]
        );  
    
   
    if (!product || product.length === 0) {
        const message = "Currently there are no products in this price range";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, categorylayout,  colors, wishlistCountlayout, cartCountlayout});
    }
    
    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }   
        return element; 
    }));
    
    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];  
    
    

   return res
   .status(200)
   .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, products: rearrangedProducts, colors, categorylayout, wishlistCountlayout, cartCountlayout});
});

const filterByColor = asyncHandler(async (req, res) => {
    const categorylayout = await Category.find({});
    let wishlistCountlayout = 0;
    let wishlistlayout = await Wishlist.find({userId: req.user._id})
    wishlistlayout = wishlistlayout[0];
    if (wishlistlayout?.productsId.length) {
        wishlistlayout.productsId.forEach(element => {
            wishlistCountlayout++;
        });        
    }
    const cartCountlayout = await Cart.find({user_id: req.user._id}).countDocuments();
    //colors for filter options
    const colors = await Color.find({}).select("-createdAt -updatedAt -hex");

    const color = req.params.color;
    const colorData = await Color.find({ color });
    console.log("Color data", colorData);

    if (!colorData || colorData.length === 0) {
        const message = "Can't find any products with this color";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, colors, categorylayout, wishlistCountlayout, cartCountlayout});      
    }
    
    const product = await ProductVarient.aggregate(
        [   
            {
                $match: {
                    color_id: new mongoose.Types.ObjectId(colorData[0]._id) 
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField : "product_id",
                    foreignField : "_id",
                    as: "name",
                    pipeline: [
                        {
                            $match: {
                                islisted : true
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
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
                $lookup: {
                    from: "colors",
                    localField : "color_id",
                    foreignField : "_id",
                    as: "color"
                } 
            },
            {
                $lookup: {
                    from: "sizes",
                    localField : "size_id",
                    foreignField : "_id",
                    as: "size"
                } 
            },
            {            
                $addFields : {
                    name : { $first: "$name" },
                    color : { $first: "$color"},
                    size : { $first: "$size" },
                }                       
            },
            {
                $project : {
                    name:1,
                    color:1,
                    size:1,
                    images:1,
                    stock:1,
                    price:1
                }
            }
        ]
        );  
    
   
    if (!product || product.length === 0) {
        const message = "Currently there are no products with this color. Try other colors.";
        return res
        .status(200)
        .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, message, categorylayout, colors, wishlistCountlayout, cartCountlayout});
    }
    
    const productList = await Promise.all(product.map(async (element) => {
        if (element.stock < 1) {
            element.isOutofStock = true;            
        }
        const isWishlisted = await Wishlist.findOne({ userId: req.user._id, productsId: element._id });
        if (isWishlisted) {
            element.isWishlisted = true;
        } else {
            element.isWishlisted = false;
        }
        const offer = await checkOffer(element.name?.category.category);
        if (offer) {
            element.originalprice = element.price;
            element.price = applyOffer(element.price, offer.discount);
            element.offerApplied = true;
        }   
        return element; 
    }));
    
    //rearranging outofstock elements to the last
    const outOfStockProducts = productList.filter(product => product.isOutofStock);
    const inStockProducts = productList.filter(product => !product.isOutofStock);
    const rearrangedProducts = [...inStockProducts, ...outOfStockProducts];

   

    return res
    .status(200)     
    .render("users/productlist", { title:"Urbane Wardrobe", user:req.user, products: rearrangedProducts, colors, categorylayout, wishlistCountlayout, cartCountlayout});

});


module.exports = {
    filterByPrice,
    filterByColor
}