const mongoose = require('mongoose');

const sizeSchema = mongoose.Schema({
        size:{
            type: String,
            required: true
        }    
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model('Size',sizeSchema);