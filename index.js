const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');

dotenv.config();

let fromEmail = process.env.FROM_EMAIL;
if (!fromEmail) {
    console.log('Missing FROM_EMAIL env var');
    process.exit(1);
}

let toEmail = process.env.TO_EMAIL;
if (!toEmail) {
    console.log('Missing TO_EMAIL env var');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const app = express();
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.send('ok');
    // res.send(
    //     '<form method=post action=/send>' +
    //     '<input type=text name=fromName placeholder=fromName value=Test>' +
    //     '<input type=text name=subject placeholder=subject>' +
    //     '<input type=text name=body placeholder=body>' +
    //     '<input type=text name=replyTo placeholder=replyTo>' +
    //     '<input type=submit value=Send>' +
    //     '</form>'
    // );
});

app.post('/send', (req, res) => {
    let fromName = req.body.fromName;
    if (!fromName || typeof fromName !== 'string') {
        res.status(400).send('Missing fromName');
        return;
    }
    let subject = req.body.subject;
    if (!subject || typeof subject !== 'string') {
        res.status(400).send('Missing subject');
        return;
    }
    let body = req.body.body;
    if (!body || typeof body !== 'string') {
        res.status(400).send('Missing body');
        return;
    }
    let replyTo = req.body.replyTo;
    if (replyTo && (typeof replyTo !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(replyTo))) {
        res.status(400).send('Invalid replyTo');
        return;
    }

    fromName = fromName.substring(0, 100).replace(/[^a-zA-Z0-9\-\.\_\ ]/, '');
    subject = subject.substring(0, 200);
    body = body.substring(0, parseInt(process.env.MAX_BODY_SIZE, 10) || 10000);

    const mailOptions = {
        from: '"' + fromName + '" <' + fromEmail + '>',
        to: toEmail,
        subject: subject,
        text: body,
    };
    if (replyTo) {
        mailOptions.replyTo = replyTo;
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            res.status(500).send(err.message);
            return;
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.send('ok');
    });
});

const server = app.listen(app.get('port'), () => {
  const port = server.address().port;
  console.log('Server running at http://localhost:' + port);
});
