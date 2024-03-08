const mongoose = require('mongoose');
const Product = require('./product.models.js');
const Size = require("./size.models.js");
const Color = require("./color.model.js");

const productVarientSchema = mongoose.Schema({
        product_id:{
            type: mongoose.Schema.Types.ObjectId,            
            ref: Product,
            required: true
        },
        size_id:{
            type: mongoose.Schema.Types.ObjectId,            
            ref: Size,
            required: true
        },
        color_id:{
            type: mongoose.Schema.Types.ObjectId,            
            ref: Color,
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
        },
        sold_count:{
            type : Number,
            default: 0
        }
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model('ProductVarient', productVarientSchema);