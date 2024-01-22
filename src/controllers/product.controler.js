const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asynchandler");
const uploadOnCloudinary = require("../utils/cloudinary");
const ProductVarient = require("../models/productvarient.models");
const ApiResponse = require("../utils/ApiResponse");


const addProductVarient = asyncHandler(async (req,res)=>{
    //get product details
    const {productName, color, size, stock,price,cost} = req.body //add remaining parameters to add into product collection

    //collecting the _id from product,color and size 
    const productId = await Product.findOne({name:productName}).select("-name -about -category -islisted -createdAt -updatedAt");
    const colorId = await Color.findOne({color:color}).select("-color -hex -createdAt -updatedAt");
    const sizeId = await size.findOne({size:size}).select("-size -createdAt -updatedAt");

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
        throw new ApiError(500,"Something went wrong while uploading productvarient to database")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        productVarient,
        "product uploaded successfully"
        )
    )
});





module.exports = {
    addProductVarient
}