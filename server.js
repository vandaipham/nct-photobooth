import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available by default. We have to create it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// INCREASE LIMITS: Bumping this to 100mb to prevent the 413 Request Entity Too Large error
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

// Use explicit SMTP settings for Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
});

app.post('/api/send-email', async (req, res) => {
  const { name, phone, email, photo } = req.body;

  if (!email || !photo) {
    return res.status(400).json({ error: 'Email and photo are required.' });
  }

  try {
    const safeName = name ? name.trim().replace(/[^a-z0-9]/gi, '_') : 'Guest';
    const safePhone = phone ? phone.trim().replace(/[^a-z0-9]/gi, '_') : 'NoPhone';
    const filename = `Metropolia_${safeName}_${safePhone}.jpg`;

    const mailOptions = {
      from: `"Metropolia Photo Booth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Metropolia Photo Booth Pictures!',
      text: `Hi ${name || 'there'},\n\nThanks for visiting the Metropolia Photo Booth! Attached are your photos.\n\nPhone: ${phone}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f25c27;">Hi ${name || 'there'}!</h2>
          <p>Thanks for visiting the Metropolia Photo Booth!</p>
          <p>Your beautiful photos are attached to this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <small style="color: #888;">Provided Phone: ${phone}</small>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          path: photo // Nodemailer converts this base64 string automatically
        }
      ]
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('CRITICAL: Error sending email via Nodemailer:', error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// Serve the built React frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Changed from '*' to /.*/ to support Express 5 routing requirements
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Using Gmail Account: ${process.env.GMAIL_USER}`);
});