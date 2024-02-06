const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const asyncHandler = require("../utils/asynchandler.js");
// require modals
const Admin = require("../models/admin.models.js");
const User = require("../models/user.models.js");
const Address = require("../models/address.models.js");


const stateNames = [    
    { name: "Andhra Pradesh" },
    { name: "Arunachal Pradesh" },
    { name: "Assam" },
    { name: "Bihar" },
    { name: "Chandigarh" },
    { name: "Chhattisgarh" },
    { name: "Dadra and Nagar Haveli" },
    { name: "Daman and Diu" },
    { name: "Delhi" },
    { name: "Goa" },
    { name: "Gujarat" },
    { name: "Haryana" },
    { name: "Himachal Pradesh" },
    { name: "Jammu and Kashmir" },
    { name: "Jharkhand" },
    { name: "Karnataka" },
    { name: "Kerala" },
    { name: "Ladakh" },
    { name: "Lakshadweep" },
    { name: "Madhya Pradesh" },
    { name: "Maharashtra" },
    { name: "Manipur" },
    { name: "Meghalaya" },
    { name: "Mizoram" },
    { name: "Nagaland" },
    { name: "Odisha" },
    { name: "Puducherry" },
    { name: "Punjab" },
    { name: "Rajasthan" },
    { name: "Sikkim" },
    { name: "Tamil Nadu" },
    { name: "Telangana" },
    { name: "Tripura" },
    { name: "Uttar Pradesh" },
    { name: "Uttarakhand" },
    { name: "West Bengal" }
  ];
  
const addressPage = asyncHandler( async(req,res)=>{
    const user = req.user
    const address = await Address.find({userid: user._id })
    console.log(address);
    res
    .status(200)
    .render("users/address",{title:"Urbane Wardrobe", user, address, layout: "userprofilelayout"})
})


const addAddressPage = asyncHandler( async(req,res)=>{
    const user = req.user;
    res
    .status(200)
    .render("users/addaddress",{title:"Urbane Wardrobe", user, state: stateNames, layout: "userprofilelayout"})
});

const addAddress = asyncHandler( async(req,res)=>{
    const user = req.user    
    const {fullName, phone, type, street, locality, district, state, pinCode} = req.body;
    console.log(req.body);
    console.log(user._id)

    const address =  await Address.create({
        userid: user._id,
        fullname : fullName,
        phone,
        type,
        street,
        locality,
        district,
        state,
        pincode : pinCode
    });

    const addedAddress = await Address.findOne({_id: address._id})

    if(!addedAddress){
        throw new ApiError(500, "Server error address not added");
    }

    res
    .status(200)
    .redirect("/api/v1/users/profile");
})

const editAddressPage = asyncHandler(async(req,res)=>{
    const user = req.user;
    const id = req.params.id;
    const address = await Address.findOne({_id:id})
    res
    .status(200)
    .render("users/editaddress",{title:"Urbane Wardrobe", user, state: stateNames, address,  layout: "userprofilelayout"})
})

const editAddress = asyncHandler( async(req,res)=>{
    console.log(req.body)
    const { addressid, fullname, phone, type, street, locality, district, state, pincode} = req.body;
    const userid = req.user._id
    
    const address = await Address.updateOne(
        {
            _id: addressid
        },
        {
            $set : {
                userid,
                fullname,
                phone,
                type,
                street, 
                locality,
                district,
                state,
                pincode
            }
        }
    );

    if(!address){
        throw new ApiError(500,"Sorry, address not modified")
    }

    res
    .status(200)
    .redirect("/api/v1/users/address");
})

module.exports = {
    addAddressPage,
    addAddress,
    addressPage,
    editAddressPage,
    editAddress

}