const express = require('express');
const router = express.Router();
const isLoggedin = require("../middlewares/isLoggedIn")
const userModel = require("../models/user-model.js");
require("../models/owners-model.js");
const productModel = require("../models/product-model")
require("../config/mongoose-connection.js")



const {
   registerUser,
   loginUser,
   logout,
} = require("../controllers/authcontroller")


router.get("/", function (req, res) {
   res.render("index");
})

router.get("/navbar", function (req, res) {
   res.render("navbar");
})

router.get("/register", function (req, res) {
   const token = req.cookies.token;
        console.log(token)

        if (token) {
            console.log("Token found, clearing it...");
            res.clearCookie("token"); // Clear the token
        }
   // res.render("register");
   let error = req.flash("error");
   res.render("register", { error });
})

router.post('/register', registerUser);


router.get("/login", async function (req, res) {

 
   if (!req.cookies.token) {

      // res.render("register");
      let error = req.flash("error");
      res.render("login", { error });
   } else {

      res.redirect("/profile");

   }

});

router.post('/login', loginUser);


router.get("/products", async function (req, res) {



   let filter = {};
   let success = req.flash("success");


   // Check if the query parameter "type" is present
   if (req.query.type) {
      filter = { type: req.query.type };
      let products = await productModel.find(filter);
      res.render("products", { products, success });
   } else {
      let products = await productModel.find();
      res.render("products", { products, success });
   }



   // Render the products page with the filtered products


   // let products = await productModel.find();  
   // let success = req.flash("success");
   //  res.render("products",{products,success}); 




});

router.get("/productdetails", async function (req, res) {
   productid = req.query.id

   let product = await productModel.findOne({ _id: productid })
   



   res.render("productdetails",{product});


});

router.get("/contactus", async function (req, res) {

   res.render("contactus");


});


router.get("/media", async function (req, res) {

   res.render("media");


});

router.get("/aboutus", async function (req, res) {

   res.render("aboutus");


});






router.get('/logout', logout);



module.exports = router;