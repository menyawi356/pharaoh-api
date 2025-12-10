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
    const { participantData } = req.body;
    
    if (!participantData || !participantData.leader_email) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    console.log('Sending confirmation email to:', participantData.leader_email);
    
    const { data, error } = await resend.emails.send({
      from: 'Pharaohs Fragments <onboarding@resend.dev>',
      to: [participantData.leader_email],
      subject: 'Registration Confirmation - Pharaohs Fragments',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FFD700; text-align: center;">🏛️ Pharaohs' Fragments</h1>
          <h2>Registration Confirmed!</h2>
          <p>Dear ${participantData.leader_name},</p>
          <p>Your registration for the <strong>Pharaohs' Fragments International Physics League</strong> has been received successfully.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Team:</strong> ${participantData.team_name}</p>
            <p><strong>Team Leader:</strong> ${participantData.leader_name}</p>
            <p><strong>School:</strong> ${participantData.leader_school || 'Not specified'}</p>
            <p><strong>Country:</strong> ${participantData.leader_country || 'Not specified'}</p>
            <p><strong>Confirmation ID:</strong> ${participantData.confirmation_token || 'N/A'}</p>
          </div>
          
          <p>We will contact you with further details about the competition schedule.</p>
          <p>For any questions, please email: pharaohsfragments.info@gmail.com</p>
          
          <p>Best regards,<br/>
          <strong>The Pharaohs' Fragments Team</strong></p>
        </div>
      `,
      text: `Registration Confirmed!\n\nDear ${participantData.leader_name},\n\nYour registration for Pharaohs' Fragments has been received.\nTeam: ${participantData.team_name}\n\nWe will contact you with competition details.\n\nBest regards,\nPharaohs' Fragments Team`,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }

    console.log('Email sent successfully');
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}