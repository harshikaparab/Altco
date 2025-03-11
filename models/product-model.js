const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    productname: String,
    type:String,
    image: String,
    price: Number,
    quantity: Number,
    discription: String,
    line1: String,
    line2: String,
    line3: String,
})

module.exports = mongoose.model("product", productSchema);


