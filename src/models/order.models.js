const mongoose = require("mongoose");


const orderSchema = mongoose.Schema({    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId:{
        type: Number,
        required: true
    },
    orderAmount: {
        type: Number,
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'shipped', 'delivered', 'canceled', 'returned'],
        default: "pending"
    },
    orderedItems: [{
        productVarientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "productvarients",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "coupons",
    },
    paymentMethod: {
        type: String,
        required: true,
        enum : ['cod', 'online']
    },
    paymentStatus: {
        type: String,
        default: "pending",
        enum : ['pending', 'paid', 'failed']
    },
    returnPeriod: {
        type: Boolean,
        default: false,        
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Orders', orderSchema);