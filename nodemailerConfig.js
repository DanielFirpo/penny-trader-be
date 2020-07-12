const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
       user: process.env.EMAIL_USERNAME,
       pass: process.env.EMAIL_PASS
    }
});

module.exports = function sendEmail(to, subject, html) {

    const message = {
        to: to,
        subject: subject,
        html: html
    };
    

    transport.sendMail(message, function(err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });

}