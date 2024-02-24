const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productVarient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVarient",
        required: true
    },
    quantity:{
        type: Number,
        default: 1
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model('Cart',cartSchema);