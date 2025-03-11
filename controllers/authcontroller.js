const nodemailer = require("nodemailer");
const userModel = require("../models/user-model");
const ownerModel = require("../models/owners-model")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.registerUser = async function (req, res) {
    try {
        

        let { username, password, email } = req.body;

        // Check if all required fields are filled
        if (!username || !password || !email) {
            req.flash("error", "Please enter all the fields");
            return res.redirect("/register");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash("error", "Please enter a valid email address");
            return res.redirect("/register");
        }


        // Check if the user already exists
        let user = await userModel.findOne({ username });
        if (user) {
            req.flash("error", "Username already taken.");
            return res.redirect("/register");
        }

        // Encrypt the password and create a new user
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                let user = await userModel.create({
                    username,
                    password: hash,
                    email
                });

                // Generate JWT token and set it in a cookie
                let token = jwt.sign({ username: username, userid: user._id }, "shhhh");
                res.cookie("token", token);

                // Send account creation confirmation email
                await sendAccountCreationEmail(user.email, user.username);

                // Redirect to login after successful registration
                res.redirect("/profile");
            });
        });

    } catch (err) {
        res.send(err.message);
    }
};

// Function to send the "Account Created" email
const sendAccountCreationEmail = async (email, username) => {
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
            to: email, // Send to the user's email
            subject: "Account Successfully Created - Alt.CO",
            html: `
                <h2>Welcome to Alt.CO, ${username}!</h2>
                <p>Your account has been successfully created. You can now log in and start exploring.</p>
                <p><b>Username:</b> ${username}</p>
                <p>Thank you for joining us!</p>
                <br>
                <p>Best regards,</p>
                <p>Alt.CO Team</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Account Creation Email sent: %s", info.messageId);

    } catch (error) {
        console.error("Error sending account creation email:", error);
    }
};


module.exports.loginUser = async (req, res) => {
    try {
        let { username, password } = req.body;
        
        if (!username || !password) {
            req.flash("error", "Please enter Username and Password");
            return res.redirect("/login")
        }


        //find the user on the basis of email
        let user = await userModel.findOne({ username });

        if (!user) {
            req.flash("error", "Incorrect Username or Password");
            return res.redirect("/login")
        }

        //checking if password entered by user is correct
        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {

                //sending a token to the user created
                let token = jwt.sign({ username: username, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.redirect("/profile")
            }
            else {
                req.flash("error", "Incorrect Username or Password");
                return res.redirect("/login")
            }
        })
    }catch (err) {
        res.send(err.message);
    }
    
}

module.exports.loginAdmin = async (req, res) => {
    try {
        let { username, password } = req.body;
        
        if (!username || !password) {
            req.flash("error", "Please enter Username and Password");
            return res.redirect("/adminlogin")
        }


        //find the user on the basis of email
        let user = await ownerModel.findOne({ username });

        if (!user) {
            req.flash("error", "Incorrect Username or Password");
            return res.redirect("/adminlogin")
        }

        //checking if password entered by user is correct
        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {

                //sending a token to the user created
                let token = jwt.sign({ username: username, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.redirect("/adminlogin/adminprofile")
            }
            else {
                req.flash("error", "Incorrect Username or Password");
                return res.redirect("/adminlogin")
            }
        })
    }catch (err) {
        res.send(err.message);
    }
    
}




module.exports.logout = function(req,res){
    res.cookie("token","");
    res.redirect("/login");
}