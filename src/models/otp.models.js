const mongoose = require("mongoose");


const otpSchema = mongoose.Schema({
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 });

module.exports = mongoose.model("Otp", otpSchema);