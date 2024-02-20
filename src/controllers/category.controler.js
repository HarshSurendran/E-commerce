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
        const dateObject = new Date(dateString);
        const day = dateObject.getDate();
        const month = dateObject.getMonth() + 1; // Months are zero-indexed, so we add 1
        const year = dateObject.getFullYear();
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

    //const categoryExist = await Category.findOne({category});
    const categoryExist = await Category.findOne({ category: { $regex: `^${category}$`, $options: 'i' } }); //checking without case sensitivity

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

const editCategory = asyncHandler( async(req,res)=>{
    const {category, id} = req.body;
    console.log("edit cat",category);
    const categoryExist = await Category.findOne({ category: { $regex: `^${category}$`, $options: 'i' } });
    console.log("This is categ exist",categoryExist);

    if(categoryExist){        
        return res
        .status(500)
        .json( new ApiError(500, "Category already exist."));        
    }
    
    const catedited = await Category.updateOne(
            {
                _id:id
            },
            {
                $set: {category}
            }
        );
    
    if(!catedited){
        return res
        .status(500)
        .json( new ApiError(500, "Category not updated."));
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {catedited}, "Category updated"));

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
    deleteCategory,
    editCategory
}