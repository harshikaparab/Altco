const jwt = require("jsonwebtoken");
const ownersModel = require("../models/owners-model");


module.exports = async function (req, res,next){
    if(!req.cookies.token){
        req.flash("error","You need to login first");
        return res.redirect("/login");

    }

    try{
        let decoded = jwt.verify(req.cookies.token, "shhhh");
        let user = await ownersModel
            .findOne({username:decoded.username})
            .select("-password");

        req.user = user;

        next();
    }catch(err){
        req.flash("error", "Something went wrong.");
        res.redirect("/login");
    }
}