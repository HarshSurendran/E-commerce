const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    about:{
        type: String,
        required: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "categorys",
        required: true
    },    
    islisted:{
        type: Boolean,
        required: true
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model('Product', productSchema);