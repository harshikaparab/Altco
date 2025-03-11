const mongoose = require('mongoose');

const ordersSchema = mongoose.Schema({
    orderID: {
        type: String,
    },
    orderstatus: String,
    products: {
        type: Array,
        default:[]
    },
    customername: String,
    email: String,
    address: Object,   
    orderDate: {
        type: Date,  
        default: Date.now, 
    },
    shipmentstatus:String,
    username: String
})

module.exports = mongoose.model("order", ordersSchema);