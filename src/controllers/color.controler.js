const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const Color = require("../models/color.model.js");

const addColor = asyncHandler( async(req,res)=>{

    const {color, hex }= req.body;
    
    const colorExist = await Color.findOne({color});

    if(colorExist){
        throw new ApiError(400, "Color already exist.");
    }

    const col = await Color.create({
        color,
        hex
    });

    if(!col){
        throw new ApiError(500, "Something went wrong while uploading color to database");
    }

    return res.
    status(200)
    .json( new ApiResponse(200,col,"Color added successfully"));
})

module.exports = {
    addColor
}