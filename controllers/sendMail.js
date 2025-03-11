const nodemailer = require("nodemailer");



const sendMail = async (req,res) => {
    

    const transporter = await nodemailer.createTransport({
        service : "gmail", 
        secure : true ,
        port: 465,
        auth: {
            user: 'companyaltco@gmail.com',
            pass: 'psqh gpyp fyws alhy'
        }
    });


    const info = await transporter.sendMail({
        from: '"Alt.CO 👻" <companyaltco@gmail.com>', // sender address
        to: "harshikaparab30@gmail.com", // list of receivers
        subject: "confirmation email", // Subject line
        text: "Hello harshika", // plain text body
        html: "<b>harshu this is a confirmation email</b>", // html body
    });


    console.log("Message sent: %s", info.messageId);
    res.send(info)


}


module.exports = sendMail;