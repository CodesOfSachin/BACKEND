import express from 'express';
import mongoose from 'mongoose';
import { DB_NAME } from './constant';

const app = express();

//1st Approach for Database connection.

;( async () => {
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error: ", (error) => {
        console.log("Error: ", error)
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port: ${process.env.PORT}`);
       } )
    } catch (err) {
        console.log('Error: ', err);
        throw err
    }
})()