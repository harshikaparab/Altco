const mongoose = require('mongoose');

const ownerSchema = mongoose.Schema({
    username: {
        type: String,
    },
    password: String,
    
    products: {
        type: Array,
        default:[]
    },
    
})

module.exports = mongoose.model("owner", ownerSchema);