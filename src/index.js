// require('dotenv').config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server running at ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection Fail !!!",err);
})











/*

import express from "express";
const app= express();


//IIFI functions
( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("Error: ",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error(error);
        throw error;
    }
})()
*/