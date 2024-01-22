const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const Size = require("../models/size.models.js");

const addSize = asyncHandler( async(req,res)=>{
    const {size} = req.body;

    const sizeExist = await Size.findOne({size});

    if(sizeExist){
        throw new ApiError(400,"Size already exists");
    }

    const createdSize = await Size.create({
        size
    });

    if(!createdSize){
        throw new ApiError(500,"Something went wrong while uploading size to db");
    }

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        createdSize,
        "Size successfully created"
    ));

})

module.exports = {
    addSize
}