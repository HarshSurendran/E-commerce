const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");

//require models
const Coupon = require("../models/coupon.models.js");


const renderCouponPage = asyncHandler( async(req,res)=>{
    const coupons1 = await Coupon.find({});
    
    const coupons = coupons1.map((element) => {
        const dateString = element.expiryDate;
        const dateObject = new Date(dateString);
        const day = dateObject.getDate();
        const month = dateObject.getMonth() + 1; 
        const year = dateObject.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        return {
            ...element.toObject(),
            expiryDate: formattedDate,
        }

    });
    
    res
    .status(200)
    .render("admin/coupon", {admin:true, title:"Urbane Wardrobe", coupons})
});

const addCoupon = asyncHandler( async(req,res)=>{
    const { name, code, description, userlimit, expiryDate, discount, minamount} = req.body;
    console.log("this is expery date", discount, minamount);
    const nameExist = await Coupon.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (nameExist) {
        throw new ApiError(400,"Coupon name already exist");
    }
    const codeExist = await Coupon.findOne({ code: { $regex: `^${code}$`, $options: 'i' } });
    if (codeExist) {
        throw new ApiError(400,"Coupon code already exist");
    }
    if (userlimit<20) {
        throw new ApiError(400,"User limit should be greater than 20");
    }
    if (parseInt(minamount)<parseInt(discount)){
        throw new ApiError(400,"Discount should be less than min amount");
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0'); 
    const currentDay = String(currentDate.getDate()).padStart(2, '0');
    const formattedCurrentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    if (expiryDate < formattedCurrentDate){        
        throw new ApiError(400,"Expiry date should be greater than current date");
    }

    const coupon = await Coupon.create({
        name,
        code,
        description,
        userlimit,
        expiryDate,
        discount,
        minamount
    });

    if (!coupon) {
        res
        .status(500)
        .json( new ApiError(500, "Coupon not created."));        
    }

    res
    .status(200)
    .json( new ApiResponse(200, coupon, "Coupon created successfully."));
});

const deleteCoupon = asyncHandler( async(req,res)=>{
    const id = req.params.id;
    console.log("This is delte id " ,id);

    if(!id){
        throw new ApiError(400, "Bad request");
    }

    const deleted = await Coupon.deleteOne({_id:id});

    res
    .status(200)
    .redirect("/api/v1/admin/coupons");
});

const editCouponPage = asyncHandler( async(req,res)=>{
    const id = req.params.id
    const coupon = await Coupon.findOne({_id: id});
    if (!coupon) {
        res.redirect("/api/v1/admin/coupons");
    }
    res
    .status(200)
    .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon})
})

const editCoupon = asyncHandler( async(req,res)=>{
    const {_id, name, code, description, userlimit, expiryDate, discount, minamount} = req.body;   
    

    const coupon = await Coupon.findOne({_id: _id});
    if(!coupon){
        let message = "Coupon not found";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }

    if (name.trim() === "") {
        let message = "Coupon name cannot be empty";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }
    if(code.trim() === ""){
        let message = "Coupon code cannot be empty";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message}) 
    }

    if(!name === coupon.name){
        const nameExist = await Coupon.findOne({ code: { $regex: `^${name}$`, $options: 'i' } });
        if (nameExist) {
            let message = "Coupon name already exist";
            return res
            .status(400)
            .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
        }
    }
    if (!code === coupon.code) {
        const codeExist = await Coupon.findOne({ code: { $regex: `^${code}$`, $options: 'i' } });
        if (codeExist) {
            let message = "Coupon code already exist";
            return res
            .status(400)
            .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
        }
    }
    if (userlimit<20) {
        let message = "User limit should be greater than 20";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }
    if (parseInt(minamount)<parseInt(discount)){
        let message = "Discount should be less than minimum amount";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0'); 
    const currentDay = String(currentDate.getDate()).padStart(2, '0');
    const formattedCurrentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    if (expiryDate < formattedCurrentDate){        
        let message = "Expiry date should be greater than current date";
        return res
        .status(400)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }
    
    const updatedcoupon = await Coupon.updateOne(
        {
            _id :_id
        },
        {
            $set: {
                name,
                code,
                description,
                userlimit,
                expiryDate,
                discount,
                minamount
            }
        }
    );
    console.log("this is updatedcOupoin", updatedcoupon);

    if (!updatedcoupon.modifiedCount === 0) {
        let message = "Coupon not updated, Problem with the server";
        return res
        .status(500)
        .render("admin/editcoupon", {admin:true, title:"Urbane Wardrobe", coupon, message})
    }

    res
    .status(200)
    .redirect("/api/v1/admin/coupons");
})


module.exports = {
    renderCouponPage,
    addCoupon,
    deleteCoupon,
    editCouponPage,
    editCoupon
}