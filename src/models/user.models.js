const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    fullname:{ 
        type: String,
        required: true
    },
    gender:{ 
        type: String,
    },
    phone:{ 
        type: Number,
        required: true
    },
    email:{ 
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password:{ 
        type: String,
        required: true
    },  
    dateofbirth:{ 
        type: Date,
    },
    isVerified:{
        type: Boolean,
        default:false,
    },
    isBlocked:{
        type: Boolean,
        default: false
    },
    image:{ 
        type: String, //cloudinary url
        default: "/assets/imgs/theme/upload.svg"
    },
    refreshToken:{
        type: String
    }
},
{
    timestamps:true
});

userSchema.pre("save",async function (next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10);
        next();
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    try {    
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName
        },
        process.env.USER_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    } catch (error) {
        console.error("Error generating user access token:", error);
        return null;
    }
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

module.exports = mongoose.model('User', userSchema);