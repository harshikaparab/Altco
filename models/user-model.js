const mongoose = require('mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/altco");


const userSchema = mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: String,
    cart:{
        type:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"product",
        }],
        default:[]
    },
    orders: {
        type:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"order",
        }],
        default:[]
    },
    contact: Number,
    picture: String,
    wishlist:{
        type:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"product",
        }],
        default:[]
    },
})

module.exports = mongoose.model("user", userSchema);