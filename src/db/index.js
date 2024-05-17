import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async () =>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connection: ${connectionInstance.connection.host}`);

    }
    catch(err){
        console.log("MONGODB Connection Error", err);
        process.exit(1);
    }
}

export default connectDB;