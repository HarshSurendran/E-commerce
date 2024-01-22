const mongoose = require('mongoose');

const colorSchema = mongoose.Schema({
        color:{
            type: String,
            required: true
        },
        hex:{
            type: String,
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Color',colorSchema);