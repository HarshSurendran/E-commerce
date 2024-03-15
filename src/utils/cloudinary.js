const cloudinary  = require('cloudinary');
const fs = require('fs');
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath){
            return null
        }                
        const response = await cloudinary.v2.uploader.upload(localFilePath, { resource_type: "auto" })
        fs.unlinkSync(localFilePath) //remocve the locally saved temporary file as the upload operation was succesfull        
        console.log("file is uploaded on cloudinary", response.url);        
        return response
    }catch(error){
        console.log(error);
        fs.unlinkSync(localFilePath)
        return null
    }
}

module.exports = uploadOnCloudinary;

