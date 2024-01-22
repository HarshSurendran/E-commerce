const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const Category = require("../models/category.models.js");
const { addProduct } = require("./product.controler.js");

const addCategory = asyncHandler( async(req,res)=>{
    const {category} = req.body;

    const categoryExist = await Category.findOne({category});

    if(categoryExist){
        throw new ApiError(400,"Category already exist");
    }

    const cat = await Category.create({
        category
    });

    if(!cat){
        throw new ApiError(500,"something went wrong while uploading category to database")
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200, 
        cat, 
        "category successfully added"
        )
    );
})

module.exports = {
    addCategory
}