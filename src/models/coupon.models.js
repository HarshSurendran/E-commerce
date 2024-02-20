const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({    
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    userlimit:{
        type: Number,
        required: true
    },
    minamount:{
        type: Number,
        required: true
    },
    description:{
        type: String
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Coupons', couponSchema);