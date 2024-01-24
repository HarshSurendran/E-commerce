const mongoose = require("mongoose");


const otpSchema = mongoose.Schema({
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    otp:{
        type: Number,
        required: true
    }    
},
{
    timestamps: true
});

module.exports = mongoose.model("Otp", otpSchema);