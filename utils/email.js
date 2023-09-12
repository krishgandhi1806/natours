const nodemailer= require('nodemailer');
const pug= require('pug');
// const htmlToText= require('html-to-text');
const { convert } = require('html-to-text');

module.exports= class Email{
    constructor(user, url){
        this.to= user.email,
        this.firstName= user.name.split(' ')[0],
        this.url= url,
        this.from= `Krish Gandhi <${process.env.EMAIL_FROM}>`
    }

    newTransport(){
        if(process.env.NODE_ENV==='production')
        {
            return nodemailer.createTransport({
                host: "smtp-relay.brevo.com",
                port: 587,
                auth:{
                    user: "caddsters04@gmail.com",
                    pass:process.env.BREVO_PASSWORD
                }
            })
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    // Send the actual email
    async send(template, subject){
        // 1) Render HTML based on a pug template
        const html= pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`,
            {
                    firstName: this.firstName,
                    url: this.url,
                    subject                
            }
        );

        // Define Email options
        const mailOptions= {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html)
        }

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    
    }

    async sendWelcome(){
        await this.send("Welcome", "Welcome to the natours family")
    }

    async sendPasswordReset(){
        await this.send("passwordReset", "Your password reset token! Valid for only 10 mins")
    }
}





// const sendEmail= async options=>{
//     // 1) Create a transporter
//     const transporter= nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port:process.env.EMAIL_PORT,
//         auth:{
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     })

//     // 2) Define the Email options
//     const mailOptions= {
//         from: 'Krish Gandhi <admin@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//     }

//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions);
// }

// module.exports= sendEmail;

