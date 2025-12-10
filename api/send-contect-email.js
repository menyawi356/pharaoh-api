import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contactData } = req.body;
    
    if (!contactData || !contactData.email) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    console.log('Sending contact notification from:', contactData.email);
    
    const { data, error } = await resend.emails.send({
      from: 'Pharaohs Fragments <onboarding@resend.dev>',
      to: ['pharaohsfragments.info@gmail.com'],
      subject: `New Contact Form: ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FFD700; text-align: center;">🏛️ New Contact Message</h1>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
          </div>
          
          <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">
            <h3>Message:</h3>
            <p>${contactData.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This message was sent from your website contact form.
          </p>
        </div>
      `,
      text: `New Contact Form Submission\n\nFrom: ${contactData.name}\nEmail: ${contactData.email}\nSubject: ${contactData.subject}\n\nMessage:\n${contactData.message}`,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ 
        error: 'Failed to send notification',
        details: error.message 
      });
    }

    console.log('Contact notification sent successfully');
    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}