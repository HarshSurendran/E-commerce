const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asynchandler");
const uploadOnCloudinary = require("../utils/cloudinary");
const ProductVarient = require("../models/productvarient.models");
const Product = require("../models/product.models.js");
const Color = require("../models/color.model.js");
const Size = require("../models/size.models.js");
const Category = require("../models/category.models.js");


const addProduct = asyncHandler( async (req,res)=>{
    //get the product details -Done
    //check wether the same product already exist -Done
    //add the product to the database -Done

    const {name,about,category,islisted} = req.body;

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
    
    return res
    .status(200)
    .json( new ApiResponse(200,
        product,
        "Product successfully added to db"
        )
    )
})

const addProductVarient = asyncHandler(async (req,res)=>{
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
    .json( new ApiResponse(
        200,
        productVarient,
        "productvarient uploaded successfully"
        )
    )
});

const editProductVarient = asyncHandler(async (req,res)=>{
    //get datas name, about, category, islisted, color ,size, image
      
})





module.exports = {
    addProductVarient,
    addProduct
}