import dotenv from 'dotenv'

dotenv.config({
    path: './env'
})

// 2nd Approach for Database connection.

import connectDB from './db/index.js'

connectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙︎ Server is running at port : ${process.env.PORT}`);
    })
})
.catch( (err) => {
    console.log("MONGO db connection failed !!! ", err)
})







// //1st Approach for Database connection.
// import mongoose from 'mongoose';
// import { DB_NAME } from './constant';
// import express from 'express';
// const app = express();


// ;( async () => {
//     try{
//        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error: ", (error) => {
//         console.log("Error: ", error)
//        })

//        app.listen(process.env.PORT, () => {
//         console.log(`App is listening on port: ${process.env.PORT}`);
//        } )

//        console.log(`MongoDB is connected !! DB HOST: ${connectionInstance}`)
//     } catch (err) {
//         console.log('Error: ', err);
        
//     }
// })()