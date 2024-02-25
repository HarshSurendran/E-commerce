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
        const month = dateObject.getMonth() + 1; // Months are zero-indexed, so we add 1
        const year = dateObject.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        console.log(formattedDate);
        return {
            ...element.toObject(), // Convert Mongoose model to plain JavaScript object
            expiryDate: formattedDate,
        }

    });
    console.log("this is coupon", coupons);
    res
    .status(200)
    .render("admin/coupon", {admin:true, title:"Urbane Wardrobe", coupons})
});

const addCoupon = asyncHandler( async(req,res)=>{
    const { name, code, description, userlimit, expiryDate, discount, minamount} = req.body;
    console.log("this is expery date", expiryDate);
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
    if (minamount>discount){
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
})


module.exports = {
    renderCouponPage,
    addCoupon
}