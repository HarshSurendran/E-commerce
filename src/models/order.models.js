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
        enum: ['Pending', 'Placed', 'Shipped', 'Delivered', 'Canceled', 'Returned'],
        default: "Pending"
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
        enum : ['COD', 'Online', 'Wallet']
    },
    paymentStatus: {
        type: String,
        default: "Pending",
        enum : ['Pending', 'Paid', 'Failed', 'Refunded']
    },
    returnPeriod: {
        type: Boolean,
        default: false,        
    },
    couponCode: {
        type: String,
        default: ""
    },
    couponDiscount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Orders', orderSchema);