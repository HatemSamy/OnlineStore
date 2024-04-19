var nodemailer = require('nodemailer');

function sendEmail(dest, subject, otp, attachments) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.nodeMailerEmail,
            pass: process.env.nodeMailerPassword, 
        },
    });

    return new Promise(function(resolve, reject) {
        transporter.sendMail({
            from: '"Mozart Application" <' + process.env.nodeMailerEmail + '>', 
            to: dest, 
            subject: subject, 
            html: otp, 
            attachments: attachments
        }, function(err, info) {
            if (err) {
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
}

module.exports = {
    sendEmail: sendEmail
};


