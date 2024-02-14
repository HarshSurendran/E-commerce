const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        balance:{
            type: Number,
            default: 0
        },
        transaction:[
            {
                amount:{
                    type: Number,
                    required: true
                },
                type: {
                    type: String,
                    enum: ['deposit', 'withdrawal'],
                    required: true
                },
                date:{
                    type: Date,
                    default: Date.now
                }
                
            },

        ]
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model('Wallet',walletSchema);