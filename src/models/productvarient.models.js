const mongoose = require('mongoose');

const productVarientSchema = mongoose.Schema({
        product_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"product",
            required: true
        },
        size_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"size",
            required: true
        },
        color_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "color",
            required: true
        },
        image:{
            type: String
        },
        stock:{
            type: Number,
            required: true
        },
        price:{
            type: Number,
            required: true
        },
        cost:{
            type: Number,
            required: true
        },
        avg_rating:{
            type: Number,
        },
        review_count:{
            type: Number
        }
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model('ProductVarient', productVarientSchema);