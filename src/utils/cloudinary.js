import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECREAT
});

const uploadOnCloudinary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null

            //upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })

            //file has been upload successfully
            // console.log("File is upload on Cloudinary Successfull",response.url);
            fs.unlinkSync(localFilePath)
            return response 
        }
        catch(err){
            fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as the        operation got failed
            return null
        }
}

export {uploadOnCloudinary}