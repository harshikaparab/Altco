const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser")
require("./config/mongoose-connection.js")
const sendMail = require("./controllers/sendMail.js")

require("dotenv").config();

const session = require('express-session');
const flash = require('connect-flash');


const indexRouter = require("./routes/indexRouter.js");
const ownersRouter = require("./routes/ownersRouter.js");
const usersRouter = require("./routes/usersRouter.js")

app.use(session({
   secret: process.env.JWT_SECRET, // Replace with a secret key
}));

app.use((req, res, next) => {
   res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
   next();
});

app.use(flash());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");


app.use("/", indexRouter);
app.use("/adminlogin", ownersRouter);
app.use("/profile",usersRouter);

app.listen(process.env.PORT||4000);