import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface BookingReminderParams {
  to: string;
  userName: string;
  spaceName: string;
  startTime: Date;
  endTime: Date;
  totalAmount: string;
}

export async function sendBookingReminder(params: BookingReminderParams): Promise<boolean> {
  try {
    const startTimeStr = params.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const endTimeStr = params.endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    await mailService.send({
      to: params.to,
      from: 'noreply@thebarnmi.com', // Replace with your verified sender
      subject: 'Reminder: Your Baseball Practice Session Tomorrow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1B365D; color: white; padding: 20px; text-align: center;">
            <h1>🥎 The Barn MI</h1>
            <h2>Booking Reminder</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${params.userName},</p>
            
            <p>This is a friendly reminder that you have a baseball practice session scheduled for tomorrow:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1B365D; margin: 0 0 10px 0;">Booking Details</h3>
              <p><strong>Space:</strong> ${params.spaceName}</p>
              <p><strong>Date & Time:</strong> ${startTimeStr} - ${endTimeStr}</p>
              <p><strong>Amount Paid:</strong> $${params.totalAmount}</p>
            </div>
            
            <p>Please arrive 5-10 minutes early to ensure you get the most out of your practice time.</p>
            
            <div style="background-color: #C41E3A; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Important:</strong> Cancellations must be made at least 24 hours in advance. Contact us if you need to modify your booking.</p>
            </div>
            
            <p>We look forward to seeing you at The Barn MI!</p>
            
            <p>Best regards,<br>The Barn MI Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>The Barn MI Baseball Practice Facility</p>
            <p>If you have any questions, please contact us.</p>
          </div>
        </div>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
