const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
    host: 'smtp.mail.us-east-1.awsapps.com',
    port: 465,
    auth: {
       user: process.env.EMAIL_USERNAME,
       pass: process.env.EMAIL_PASS
    },
    requireTLS: true,
    secure: true
});

module.exports = function sendEmail(to, subject, html) {

    const message = {
        to: to,
        subject: subject,
        html: html,
        from: process.env.EMAIL_USERNAME

    };
    

    transport.sendMail(message, function(err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });

}