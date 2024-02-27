const mongoose = require("mongoose");

const offerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    banner:{
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model('Offer', offerSchema)