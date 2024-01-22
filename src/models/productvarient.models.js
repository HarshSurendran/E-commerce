const mongoose = require('mongoose');

const productVarientSchema = mongoose.Schema({
        product_id:{
            //type: mongoose.Schema.Types.ObjectId,
            type:Number,
            ref:"product",
            required: true
        },
        size_id:{
            //type: mongoose.Schema.Types.ObjectId,
            type:Number,
            ref:"size",
            required: true
        },
        color_id:{
            //type: mongoose.Schema.Types.ObjectId,
            type:Number,
            ref: "color",
            required: true
        },
        images:[
            {
            type: String
            }
        ],
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