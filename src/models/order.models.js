const mongoose = require("mongoose");


const orderSchema = mongoose.Schema({    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
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
        ref: "addresses",
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'shipped', 'delivered', 'canceled'],
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
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "coupons",
    },
    paymentMethod: {
        type: String,
        required: true,
        enum : ['cod', 'online']
    }
},
{
    timeStamps: true
});

module.exports = mongoose.model('Orders', orderSchema);