const mongoose = require("mongoose");
const productVarient = require("./productvarient.models.js");
const user = require("./user.models.js");

const wishlistSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: user,
        required: true
    },
    productsId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: productVarient,
        required: true
    }]
})

module.exports = mongoose.model("wishlist", wishlistSchema)