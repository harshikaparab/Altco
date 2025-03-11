const express = require('express');
const router = express.Router();
const isLoggedin = require("../middlewares/isLoggedIn")
const userModel = require("../models/user-model.js");
const orderModel = require("../models/orders-model.js");
const sendMail = require("../controllers/sendMail.js")
require("../models/owners-model.js");
const productModel = require("../models/product-model")
require("../config/mongoose-connection.js")

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


router.get("/", isLoggedin, async function (req, res) {
  
  

  if (req.session.cart) {
    
    let puser0 = await userModel.findOne({ username: req.user.username })
    
    const cart = req.session.cart;
    const customer = req.session.customer;
    const paymentstatus = req.session.paymentstatus
    const orderID = req.session.orderID;
    const customerName = customer.name;
    const customerEmail = customer.email;
    const customerAddress = customer.address;

    let order = await orderModel.create({
      orderID: orderID,
      orderstatus: paymentstatus,
      products: cart,
      customername: customerName,
      email: customerEmail,
      address: customerAddress,
      shipmentstatus:"Processing",
      username: puser0.username

    });


    // Clear session data if needed
    delete req.session.cart;
    delete req.session.customer;
    delete req.session.paymentstatus;
    delete req.session.orderID;

    let user = req.user
    let puser = await userModel.findOne({ username: req.user.username }).populate('orders');
    let orderid = order.id;

    puser.orders.push(orderid);
    await puser.save();


    // let orderDate = order.orderDate.toLocaleDateString()
    // let orderTime = order.orderDate.toLocaleTimeString()




    res.render("profile", { user: puser });

  } else {
    const cart = "";
    const customer = "";
    const paymentstatus = ""
    const orderID = "";
    const customerName = "";
    const customerEmail = "";
    const customerAddress = "";

    let user = req.user;
    let puser = await userModel.findOne({ username: user.username }).populate('orders');

    // Send orders along with user to the template
    res.render("profile", { user: puser });
  }




})


router.get("/orderhistory", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username }).populate("orders")
  // console.log(user)

  let orders = user.orders
  // console.log(orders)

  let deliveredOrders = orders.filter(order => order.shipmentstatus === 'Delivered');
  // console.log("Delivered Orders: ", deliveredOrders);
  
  res.render("orderhistory",{deliveredOrders , user})


})



router.get("/cart", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username }).populate("cart")
  // res.send(user.cart)

  let cart = user.cart


  res.render("cart", { cart })

})


//add to cart
router.post("/cart", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username })
  let product = req.body.id;

  user.cart.push(product);
  await user.save();

 
  req.flash("success", "added to cart");
  res.redirect("/products")

})

router.post("/removecart", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username })
  let productId = req.body.id;

  const productIndex = user.cart.findIndex(product => product._id.toString() === productId);

  // If the product is found, remove it from the cart
  if (productIndex > -1) {
    user.cart.splice(productIndex, 1);  // Remove 1 product at the found index
  }

  await user.save();



  res.redirect('/profile/cart');


})



router.post("/checkout", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username }).populate("cart")
  let totalPrice = req.body.totalPrice;

  
  let line_items = user.cart.map(product => ({
    price_data: {
      currency: 'inr', // Change to your preferred currency
      product_data: {
        name: product.productname, // Product name from cart
      },
      unit_amount: product.price * 100, // Convert price to cents
    },
    quantity: 1 // Assuming 1 unit of each product
  }));


  const session = await stripe.checkout.sessions.create({
    line_items: line_items, // Pass the dynamic line items here
    mode: 'payment',
    shipping_address_collection: {
      allowed_countries: ['IN'] // Adjust based on allowed countries
    },
    success_url: `${process.env.BASE_URL}/profile/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/profile/cancel`
  });

  // Redirect to Stripe Checkout
  res.redirect(session.url);






})


const nodemailer = require("nodemailer");

router.get("/complete", isLoggedin, async function (req, res) {
  let user = await userModel.findOne({ username: req.user.username }).populate("cart");
  let cart = user.cart;

  const [session, lineItems] = await Promise.all([
    stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['payment_intent.payment_method'] }),
    stripe.checkout.sessions.listLineItems(req.query.session_id)
  ]);

  let customer = session.customer_details;
  let orderID = session.id;

  if (session.payment_status === 'paid') {
    for (const product of cart) {
      let productid = product._id;
      let qproduct = await productModel.findOne({ _id: productid });
      let pquantity = qproduct.quantity;

      console.log("quantity before", pquantity);
      pquantity -= 1;

      qproduct.quantity = pquantity; // Update the quantity field
      await qproduct.save(); // Save the product with updated quantity

      console.log("quantity after", qproduct.quantity);
    }

    user.cart = [];
    await user.save();

    req.session.paymentstatus = "payment successful";

    // Send Order Confirmation Email
    await sendOrderConfirmationEmail(user, customer, orderID, lineItems, session); // Pass session

  } else {
    req.session.paymentstatus = "payment unsuccessful";
  }

  req.session.cart = cart;
  req.session.customer = customer;
  req.session.orderID = orderID;

  res.redirect('/profile');
});

// Function to send the order confirmation email
const sendOrderConfirmationEmail = async (user, customer, orderID, lineItems, session) => { // Accept session
  const transporter = await nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: 'companyaltco@gmail.com',
      pass: 'psqh gpyp fyws alhy' // Your app password
    }
  });

  let productDetails = lineItems.data.map(item => {
    return `<li>${item.description} - Quantity: ${item.quantity}</li>`;
  }).join("");

  const mailOptions = {
    from: '"Alt.CO 👻" <companyaltco@gmail.com>',
    to: customer.email, // Sending to the customer's email
    subject: "Order Confirmation - Alt.CO",
    html: `
      <h2>Order Confirmation</h2>
      <p>Hi ${customer.name},</p>
      <p>Thank you for your order! Here are the details:</p>
      <p><b>Order ID:</b> ${orderID}</p>
      <ul>${productDetails}</ul>
      <p><b>Total Amount:</b> ${session.amount_total / 100} ${session.currency.toUpperCase()}</p>
      <p>Shipping to: ${customer.address.line1}, ${customer.address.city}, ${customer.address.postal_code}, ${customer.address.country}</p>
      <p>We will notify you once your order is shipped!</p>
      <br>
      <p>Thank you for shopping with Alt.CO!</p>
    `
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log("Order Confirmation Email sent: %s", info.messageId);
};


router.get("/cancel", isLoggedin, async function (req, res) {
  res.redirect("/products")

})







  
  


   







module.exports = router;