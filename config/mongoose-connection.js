const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("mondoDB connected")
})
.catch((err)=>{
    console.log(err)
})