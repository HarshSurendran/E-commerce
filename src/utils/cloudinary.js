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
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //file has been uploaded successfully

        console.log("file is uploaded on cloudinary", response.url);
        return response

    }catch(error){
        fs.unlinkSync(localFilePath) //remocve the locally saved temporary file as the upload operation failed
        return null
    }
}

module.exports = {
    uploadOnCloudinary
}