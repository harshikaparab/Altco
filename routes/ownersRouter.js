const express = require('express');
const router = express.Router();

const nodemailer = require("nodemailer");

const userModel = require("../models/user-model");


const upload = require("../middlewares/multerconfig")
const isadminLoggedin = require("../middlewares/isadminloggedin")
const productModel = require("../models/product-model")
const orderModel = require("../models/orders-model")
const cloudinary = require("cloudinary").v2
const fs = require('fs')

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});

const {
    loginAdmin,
 } = require("../controllers/authcontroller")


 
router.get("/", function(req,res){
    let error = req.flash("error");
    res.render("adminlogin",{error});   
})

router.post('/', loginAdmin);




router.get("/adminprofile", isadminLoggedin ,async function(req,res){
    let products = await productModel.find();    
    res.render("adminprofile", {products})
    
 })

 //creation of product
 router.post("/adminprofile", upload.single("image"), async function(req,res){
    try {

        // console.log(req.file.path)
        const x = await cloudinary.uploader.upload(req.file.path)
        

        let { productname,price, quantity, discription,type,line1,line2,line3 } = req.body;
        
        let product = await productModel.create({
            image:x.secure_url,
            productname: productname,
            price: price,
            quantity: quantity,
            discription: discription,
            type: type,
            line1:line1,
            line2:line2,
            line3:line3
        });

        fs.unlink((req.file.path), function(err) {
            if (err) console.log(err);
            
        });

        res.redirect("/adminlogin/adminprofile")



    } catch (err) {
       
    }
    
 })



 router.post("/deleteproduct",isadminLoggedin, async function(req,res){
    const productId = req.body.id; // Get product ID from the form
    await productModel.findByIdAndDelete(productId); // Delete the product by ID

    res.redirect("/adminlogin/adminprofile")
    
})

router.post("/editproduct/:id",isadminLoggedin, async function(req,res){
    const productId = req.params.id; // Get product ID from the form
    console.log(productId)

    const { productname, price, quantity, description } = req.body;

    await productModel.findByIdAndUpdate(productId, {
        productname,
        price,
        quantity,
        description
      });

      res.redirect("/adminlogin/adminprofile")
   
    
})


router.get("/vieworders", isadminLoggedin ,async function(req,res){
    // let orders = await orderModel.find();    
    // res.render("adminorders", {orders})


    let filter = {};
    // let success = req.flash("success");

    // Check if the query parameter "type" is present
    if (req.query.type) {
        filter = { shipmentstatus: req.query.type }; 
        let orders = await orderModel.find(filter);
        res.render("adminorders", {orders})
    }else{
        let orders = await orderModel.find();
      res.render("adminorders", {orders})
    }
    
 })



 

//  router.post("/updateshipmentStatus/:id", isadminLoggedin, async function(req, res) {
//     let orderid = req.params.id;

//     let value = req.body.type; // New shipment status value
    

//     // Find the order by ID
//     let order = await orderModel.findOne({_id: orderid});
    

//     // Update the shipment status directly on the order object
//     order.shipmentstatus = value;

//     // Save the updated order
//     await order.save();

    

//     // Redirect to the orders page
//     res.redirect("/adminlogin/vieworders");
// });


 


// Function to send shipment email
const sendShipmentEmail = async (email, username, orderId) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            port: 465,
            auth: {
                user: 'companyaltco@gmail.com',
                pass: 'psqh gpyp fyws alhy' // Your app-specific password
            }
        });

        const mailOptions = {
            from: '"Alt.CO 👻" <companyaltco@gmail.com>',
            to: email,
            subject: "Your Order Has Been Shipped - Alt.CO",
            html: `
                <h2>Hi ${username},</h2>
                <p>Good news! Your order with ID <b>${orderId}</b> has been shipped.</p>
                
                <br>
                <p>Thank you for shopping with us!</p>
                <br>
                <p>Best regards,</p>
                <p>Alt.CO Team</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Shipment Email sent: %s", info.messageId);

    } catch (error) {
        console.error("Error sending shipment email:", error);
    }
};

// Function to send delivery email
const sendDeliveryEmail = async (email, username, orderId) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            port: 465,
            auth: {
                user: 'companyaltco@gmail.com',
                pass: 'psqh gpyp fyws alhy' // Your app-specific password
            }
        });

        const mailOptions = {
            from: '"Alt.CO 👻" <companyaltco@gmail.com>',
            to: email,
            subject: "Your Order Has Been Delivered - Alt.CO",
            html: `
                <h2>Hello ${username},</h2>
                <p>We are happy to inform you that your order with ID <b>${orderId}</b> has been delivered.</p>
                <p>We hope you are satisfied with your purchase. If you have any questions, feel free to contact us.</p>
                <br>
                <p>Thank you for your purchase!</p>
                <br>
                <p>Best regards,</p>
                <p>Alt.CO Team</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Delivery Email sent: %s", info.messageId);

    } catch (error) {
        console.error("Error sending delivery email:", error);
    }
};

// Route to update shipment status and send email
router.post("/updateshipmentStatus/:id", isadminLoggedin, async function(req, res) {
   
    let orderId = req.params.id;
    let value = req.body.type; // New shipment status value


    try {
        // Find the order by ID
        let order = await orderModel.findOne({_id: orderId});
        
        
        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Find the user by order userId
        let user = await userModel.findOne({username: order.username});
        
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Update the shipment status
        order.shipmentstatus = value;
        await order.save();

        // Send email based on the new status
        switch (value) {
            case "Shipped":
                await sendShipmentEmail(user.email, user.username, orderId);
                break;
            case "Delivered":
                await sendDeliveryEmail(user.email, user.username, orderId);
                break;
            // Optionally, you can handle other cases or default here
            default:
                console.log("No email sent for status:", value);
                break;
        }

        // Redirect to the orders page
        res.redirect("/adminlogin/vieworders");
        
    } catch (err) {
        res.status(500).send(err.message);
    }
});









 module.exports = router;