const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
const Category = require("../models/category.models.js");

const categoryPage = asyncHandler( async(req,res)=>{
    let category = await Category.find({}).select(" -updatedAt");

    if(!category){
        throw new ApiError(500, "Couldnt fetch category data");
    }

    const updatedCategory = category.map((element) => {
        // Provided date string
        console.log(element)
        const dateString = element.createdAt;
        console.log(dateString);
        // Create a new Date object from the provided string
        const dateObject = new Date(dateString);
  
        // Get day, month, and year
        const day = dateObject.getDate();
        const month = dateObject.getMonth() + 1; // Months are zero-indexed, so we add 1
        const year = dateObject.getFullYear();
  
        // Format the date components
        const formattedDate = `${day}/${month}/${year}`;
        console.log(formattedDate);
        
        return {
            ...element.toObject(), // Convert Mongoose model to plain JavaScript object
            date: formattedDate,
        }

      });


      console.log(updatedCategory);
    res
    .status(200)
    .render("admin/category",{ admin:true, title:"Urbane Wardrobe", category:updatedCategory});
})

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

const deleteCategory = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    console.log("This is delte id " ,id);

    if(!id){
        throw new ApiError(400, "Bad request");
    }

    const deleted = await Category.deleteOne({_id:id});

    res
    .status(200)
    .redirect("/api/v1/admin/category");
})

module.exports = {
    addCategory,
    categoryPage,
    deleteCategory
}