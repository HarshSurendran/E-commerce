require('dotenv').config();
const connectDB = require("./db/index.js")
const app = require('./app.js')

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`Server started at http://localhost:${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongo connection failed", error);
})
