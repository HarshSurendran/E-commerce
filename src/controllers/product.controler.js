const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asynchandler");
const uploadOnCloudinary = require("../utils/cloudinary");
const ProductVarient = require("../models/productvarient.models");
const Product = require("../models/product.models.js");
const Color = require("../models/color.model.js");
const Size = require("../models/size.models.js");
const Category = require("../models/category.models.js");
const mongoose = require("mongoose");


const addProductPage = asyncHandler( async (req,res)=>{
        
    const category = await Category.find({}).select("-createdAt -updatedAt ");
    
    if(!category){
        throw new ApiError(500,"server error while getting size and color")
    }
    
    res
    .status(200)
    .render("admin/addproduct",{admin:true, title:"Urbane Products", category});
});

const addProduct = asyncHandler( async (req,res)=>{
    //get the product details -Done
    //check wether the same product already exist -Done
    //add the product to the database -Done
    console.log(req.body);
    const {name,about,category,islisted} = req.body;
    console.log(typeof(name));

    const productExist = await Product.findOne({name});

    if(productExist){
        throw new ApiError(400,"Product already exist");
    }

    const categoryId = await Category.findOne({category})

    const product = await Product.create({
        name,
        about,
        category: categoryId._id,
        islisted
    });

    if(!product){
        throw new ApiError(500,"Something went wrong Product is not added in db");
    }

    console.log("Product is added to the db");
    
    return res
    .status(200)
    .json( new ApiResponse(200,
        product,
        "Product successfully added to db"
        )
    )
});

const onlyProductsList = asyncHandler( async (req,res)=>{
    //const products = await Product.find({}).select(" -updatedAt");
    const products = await Product.aggregate([
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "category",
                as: "category"
            }
        },
        {
            $addFields: {
                category: { $first : "$category" }
            }
        },
        {
            $project: {
              _id: 1,
              date: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$createdAt"
                }
              },
              name:1,
              about:1,
              category:1,
              islisted:1
            }
        }
    ]);

    if(!products){
        throw new ApiError(500, "Something went wrong while fetching product details");
    }

    const category = await Category.find({}).select("-createdAt -updatedAt");

    if(!category){
        throw new ApiError(500, "Something went wrong while fetching category details");
    }

    res.render("admin/onlyProductList", {admin: true, title: "Urbane Wardrobe", products, category});
});

const editProductPage = asyncHandler ( async (req,res)=>{
    const id = req.params.id;
    console.log(id);   
    const product = await Product.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(id)}
        },
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "category",
                as: "category"
            }
        },
        {
            $addFields: {
                category: { $first : "$category" }
            }
        },
        {
            $project: {
              _id: 1,
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt"
                }
              },
              name:1,
              about:1,
              category:1,
              islisted:1
            }
          }
    ]);
    if(!product){
        throw new ApiError(500, "Something went wrong while fetching product details")
    }
    
    const prodDetails = product[0]
    
    const cat = await Category.find({}).select("-createdAt -updatedAt");

    if(!cat){
        throw new ApiError(500, "Something went wrong while fetching category details")
    }    

    res.render("admin/editProduct", {admin:true, title:"Urbane Wardrobe", prodDetails, cat})
});

const editProduct = asyncHandler( async(req,res)=>{
    
    const {id, name, about, category, islisted } = req.body    

    const catId = await Category.findOne({category}).select("-createdAt -updatedAt");

    const product = await Product.updateOne(
        {
            _id:id
        },
        {
            $set: {
                name, 
                about, 
                category: catId, 
                islisted
            }
        }
    );

    console.log(product);

    if(!product.acknowledged){
        throw new ApiError(500,"update failed");
    }

    res
    .status(200)
    .json( new ApiResponse(
        200,
        product,
        "productvarient uploaded successfully"
        )
    )
});

const deleteProduct = asyncHandler( async(req,res)=>{

    const id = req.params.id;

    try{
        const deleteProductVarient = await ProductVarient.deleteMany({product_id:id});
        const deleted = await Product.deleteOne({_id:id});
    }catch (error) {
        console.log("some error while deleting the product", error);
    }

    console.log("This is the response after deletion");    
    
    res
    .status(200)
    .redirect("/api/v1/admin/products");
})

const addProductVarientPage = asyncHandler( async(req,res)=>{
    const color = await Color.find({}).select("-createdAt -updatedAt -hex");    
    const size = await Size.find({}).select("-createdAt -updatedAt ");

    if(!(color || size)){
        throw new ApiError(500,"server error while getting size and color")
    }    

    res
    .status(200)
    .render("admin/addproductVarient",{admin:true, title:"Urbane Wardrobe", color, size});
})

const addProductVarient = asyncHandler( async (req,res)=>{
    //get product details
    const {productname, color, size, stock, price, cost} = req.body //add remaining parameters to add into product collection
        
    //collecting the _id from product,color and size 
    const productId = await Product.findOne({name:productname}).select("-name -about -category -islisted -createdAt -updatedAt");    
    const colorId = await Color.findOne({color:color}).select("-color -hex -createdAt -updatedAt");    
    const sizeId = await Size.findOne({size:size}).select("-size -createdAt -updatedAt");    

    if(!(productId&&colorId&&sizeId)){
        throw new ApiError(400,"The product size or color given is invalid")
    }

    //File Handling
    if(!req.files){
        throw new ApiError(400,"The image path is null")
    }
    
    let urls = [];
  
    for(file of req.files){
        const uploadedToCloudinary = await uploadOnCloudinary(file.path);
        
        if(!uploadedToCloudinary){
            throw new ApiError(500,`Error in uploading file number ${ind}`)
        }

        urls.push(uploadedToCloudinary.url);
    }

    //add it to the database
    const productVarient = ProductVarient.create({
        product_id:productId._id,
        size_id:sizeId._id,
        color_id:colorId._id,        
        stock,
        price,
        cost,
        images: urls
    })

    if(!productVarient){
        throw new ApiError(500, "Something went wrong while uploading productvarient to database")
    }

    return res
    .status(200)
    // .json( new ApiResponse(
    //     200,
    //     productVarient,
    //     "productvarient uploaded successfully"
    //     )
    // )
    .redirect("products")
});

// const editProductVarient = asyncHandler( async (req,res)=>{
//     //get datas name, about, category, islisted, 
//     //check whether every pic is edited
// });

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
    .render("users/productlist",{user:req.user, products: productList});
});

const productDetailsPage = asyncHandler( async(req,res)=>{
    const prodId = req.params.id;
    console.log("This is the product id to productdetails",prodId);
    console.log("This is user ", req.user);

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


    if(prod.length === 0){
        return res
        .status(400)
        .render("error")        
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
    .render("proddetails", {user:req.user, title:"Urbane Wardrobe", product: prodDetails, prodVarients});
});

const listUnlistProduct = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    console.log(id);
    const product = await Product.findOne({_id:id})

    if(!product){
        res
        .status(400)
        .json( new ApiError(400,"Bad request product id is not valid"))
    }

    if(product.islisted == true){
        console.log("Entered islisted true");
        const Updated = await Product.updateOne({_id:id},{
            $set: { islisted: false }
        });
    }else{
        console.log("Entered islisted false");
        const Updated = await Product.updateOne({_id:id},{
            $set: { islisted: true }
        });    
    }

    res
    .status(200)
    .json( new ApiResponse(200, {}, "task success"))
});

const menslistPage = asyncHandler( async(req,res)=>{

    const mensProductList = await ProductVarient.aggregate(
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
                                islisted : true,
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category",
                                pipeline: [
                                    {
                                        $match: {
                                            category: "Mens"
                                        }
                                    }
                                ]
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
        const mensProducts = mensProductList.filter((element)=>{
            if(element.name.category){
                return true
            }
            return false
        })
        
        res
        .status(200)
        //.json( new ApiResponse(200, {mensProducts}, "fetched"))
        .render("users/categoryproductlist",{title:"Urbane Wardrobe", user: true, products: mensProducts});
})

const womenslistPage = asyncHandler( async(req,res)=>{

    const womensProductList = await ProductVarient.aggregate(
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
                                islisted : true,
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category",
                                pipeline: [
                                    {
                                        $match: {
                                            category: "Womens"
                                        }
                                    }
                                ]
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
        const womensProducts = womensProductList.filter((element)=>{
            if(element.name.category){
                return true
            }
            return false
        })
        
        res
        .status(200)
        //.json( new ApiResponse(200, {womensProducts}, "fetched"))
        .render("users/categoryproductlist",{title:"Urbane Wardrobe", user: true, products: womensProducts});
})

const kidslistPage = asyncHandler( async(req,res)=>{

    const kidsProductList = await ProductVarient.aggregate(
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
                                islisted : true,
                            }
                        },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category",
                                pipeline: [
                                    {
                                        $match: {
                                            category: "Kids"
                                        }
                                    }
                                ]
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
        const kidsProducts = kidsProductList.filter((element)=>{
            if(element.name.category){
                return true
            }
            return false
        })
        
        res
        .status(200)
        //.json( new ApiResponse(200, {kidsProducts}, "fetched"))
        .render("users/categoryproductlist",{title:"Urbane Wardrobe", user: true, products: kidsProducts});
})





module.exports = {
    addProductVarient,
    addProduct,
    listProducts,
    addProductPage,
    onlyProductsList,
    editProductPage,
    editProduct,
    deleteProduct,
    addProductVarientPage,
    productDetailsPage,
    listUnlistProduct,
    menslistPage,
    womenslistPage,
    kidslistPage
}