const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const ProductVarient = require("../models/productvarient.models.js");
const Product = require("../models/product.models.js");
const mongoose = require("mongoose");

const renderHomePage = asyncHandler( async(req,res)=>{

    const productList = await ProductVarient.aggregate(
        [   
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
    res
    .status(200)
    .render("landingPage", {common:true , title: "Urbane Wardrobe" , products: productList});
});

const renderLoginPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("userlogin", {common:true , title: "Urbane Wardrobe"});
});

const renderRegisterPage = asyncHandler( async(req,res)=>{
    res
    .status(200)
    .render("userregister", {common:true , title:"urbane Wardrobe"});

});

const productDetailsPage = asyncHandler( async(req,res)=>{

    const prodId = req.params.id;
    console.log("This is the product id to productdetails",prodId);
   

    const prod = await ProductVarient.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(prodId) 
            }
        },
        {
            $lookup : {
                from : "products",
                localField : "product_id",
                foreignField : "_id",
                as : "name",
                pipeline : [
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
                name : { $first : "$name"},
                color : { $first : "$color"},
                size : { $size : "$size"}
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
    ]);

    if(!prod){
        throw new ApiError(400,"Bad request prod id is not valid");
    }

    const prodDetails = prod[0];
    console.log(prodDetails);

    const mainProdId = prodDetails.name._id;

    console.log("Thisis mainprod id",mainProdId);
    
    const prodVarients = await ProductVarient.aggregate([
        {
            $match: {
                product_id : new mongoose.Types.ObjectId(mainProdId) 
            }
        },
        {
            $lookup : {
                from : "products",
                localField : "product_id",
                foreignField : "_id",
                as : "name",
                pipeline : [
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
                name : { $first : "$name"},
                color : { $first : "$color"},
                size : { $size : "$size"}
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
    ]);
    //lookupthe color and size etc
    console.log("Thisi s the prodvarients",prodVarients);

    res
    .status(200)
    .render("proddetails", {common:true, title:"Urbane Wardrobe", product: prodDetails, prodVarients});
});

const listProducts = asyncHandler( async(req,res)=>{
    const productList = await ProductVarient.aggregate(
    [   
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

    res
    .status(200)
    .render("common/guestlistproducts",{common:true, products: productList});
});

module.exports= {
    renderHomePage,
    renderLoginPage,
    renderRegisterPage,
    productDetailsPage,
    listProducts
}