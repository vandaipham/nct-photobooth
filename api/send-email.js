import nodemailer from 'nodemailer';

// Vercel config to increase the default payload limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Note: Vercel Free tier maxes out at 4.5MB
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, photo } = req.body;

  if (!email || !photo) {
    return res.status(400).json({ error: 'Email and photo are required.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const safeName = name ? name.trim().replace(/[^a-z0-9]/gi, '_') : 'Guest';
    const safePhone = phone ? phone.trim().replace(/[^a-z0-9]/gi, '_') : 'NoPhone';
    const filename = `Metropolia_${safeName}_${safePhone}.jpg`;

    const mailOptions = {
      from: `"Metropolia Photo Booth" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Metropolia Photo Booth Pictures!',
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
          path: photo 
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Nodemailer error:', error);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
}