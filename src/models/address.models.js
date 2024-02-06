const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    type:{
        type: String,
        required: true    
    },
    fullname:{ 
        type: String,
        required: true
    },    
    phone:{ 
        type: Number,
        required: true
    },
    street:{
        type: String,
        required: true
    },
    locality:{
        type: String,
        required: true
    },
    district:{
        type: String,
        required: true
    },
    state:{
        type: String,
        required: true
    },
    pincode:{
        type: Number,
        required:true
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model('Address',addressSchema);