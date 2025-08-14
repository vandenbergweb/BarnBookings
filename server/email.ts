import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Missing required SendGrid API key: SENDGRID_API_KEY');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface BookingConfirmationData {
  to: string;
  userName: string;
  spaceName: string;
  startTime: Date;
  endTime: Date;
  totalAmount: string;
  bookingId: string;
}

interface BookingReminderData {
  to: string;
  userName: string;
  spaceName: string;
  startTime: Date;
  endTime: Date;
  totalAmount: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
  try {
    const { to, userName, spaceName, startTime, endTime, totalAmount, bookingId } = data;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const msg = {
      to,
      from: {
        email: 'noreply@thebarnmi.com',
        name: 'The Barn MI'
      },
      subject: 'Booking Confirmed - The Barn MI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e3a5f; margin-bottom: 10px;">The Barn MI</h1>
            <p style="color: #666; font-size: 18px; margin: 0;">Professional Baseball Training Facility</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">6090 W River Rd, Weidman MI 48893</p>
          </div>

          <div style="background-color: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 24px;">🎉 Booking Confirmed!</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for choosing The Barn MI</p>
          </div>

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e3a5f; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Booking Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: 500;">Facility:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${spaceName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: 500;">Date:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${formatDate(startTime)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: 500;">Time:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${formatTime(startTime)} - ${formatTime(endTime)}</td>
              </tr>
              <tr>
                <td style="padding: 15px 0 10px 0; color: #666; font-weight: 500; font-size: 18px;">Total Paid:</td>
                <td style="padding: 15px 0 10px 0; font-weight: bold; text-align: right; font-size: 20px; color: #22c55e;">$${totalAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Important Reminders</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Please arrive <strong>10 minutes early</strong> for check-in</li>
              <li>Bring your own water bottle and towel</li>
              <li>Athletic attire and proper footwear required</li>
              <li>Contact us if you need to reschedule or cancel</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; color: #666;">Questions about your booking?</p>
            <p style="margin: 0; font-weight: 600; color: #1e3a5f;">
              📧 info@thebarnmi.com<br>
              📞 (555) 123-BARN<br>
              📍 6090 W River Rd, Weidman MI 48893
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 14px;">
            <p style="margin: 0;">Booking ID: #${bookingId}</p>
            <p style="margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} The Barn MI. All rights reserved.<br>
              Professional Baseball Training Facility
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${userName},

Your booking at The Barn MI has been confirmed!

BOOKING DETAILS:
- Facility: ${spaceName}
- Date: ${formatDate(startTime)}
- Time: ${formatTime(startTime)} - ${formatTime(endTime)}
- Total Paid: $${totalAmount}

IMPORTANT REMINDERS:
- Please arrive 10 minutes early for check-in
- Bring your own water bottle and towel
- Athletic attire and proper footwear required
- Contact us if you need to reschedule or cancel

Questions? Contact us at:
Email: info@thebarnmi.com
Phone: (555) 123-BARN
Address: 6090 W River Rd, Weidman MI 48893

Booking ID: #${bookingId}

Thank you for choosing The Barn MI!

© ${new Date().getFullYear()} The Barn MI. All rights reserved.
      `
    };

    await sgMail.send(msg);
    console.log(`Booking confirmation email sent to ${to} for booking ${bookingId}`);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}

export async function sendBookingReminder(data: BookingReminderData): Promise<boolean> {
  try {
    const { to, userName, spaceName, startTime, endTime, totalAmount } = data;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const msg = {
      to,
      from: {
        email: 'noreply@thebarnmi.com',
        name: 'The Barn MI'
      },
      subject: 'Reminder: Your Training Session Tomorrow - The Barn MI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Training Session Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e3a5f; margin-bottom: 10px;">The Barn MI</h1>
            <p style="color: #666; font-size: 18px; margin: 0;">Professional Baseball Training Facility</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">6090 W River Rd, Weidman MI 48893</p>
          </div>

          <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 24px;">⏰ Session Reminder</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your training session is tomorrow!</p>
          </div>

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e3a5f; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Session Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: 500;">Facility:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${spaceName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666; font-weight: 500;">Date:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">${formatDate(startTime)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 500;">Time:</td>
                <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #3b82f6;">${formatTime(startTime)} - ${formatTime(endTime)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Don't Forget:</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Arrive <strong>10 minutes early</strong> for check-in</li>
              <li>Bring water bottle and towel</li>
              <li>Wear athletic attire and proper footwear</li>
              <li>Contact us if you need to cancel or reschedule</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; color: #666;">Questions or need to reschedule?</p>
            <p style="margin: 0; font-weight: 600; color: #1e3a5f;">
              📧 info@thebarnmi.com<br>
              📞 (555) 123-BARN<br>
              📍 6090 W River Rd, Weidman MI 48893
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 14px;">
            <p style="margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} The Barn MI. All rights reserved.<br>
              Professional Baseball Training Facility
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${userName},

This is a reminder that your training session at The Barn MI is tomorrow!

SESSION DETAILS:
- Facility: ${spaceName}
- Date: ${formatDate(startTime)}
- Time: ${formatTime(startTime)} - ${formatTime(endTime)}

DON'T FORGET:
- Arrive 10 minutes early for check-in
- Bring water bottle and towel
- Wear athletic attire and proper footwear
- Contact us if you need to cancel or reschedule

Questions or need to reschedule?
Email: info@thebarnmi.com
Phone: (555) 123-BARN
Address: 6090 W River Rd, Weidman MI 48893

See you tomorrow!

© ${new Date().getFullYear()} The Barn MI. All rights reserved.
      `
    };

    await sgMail.send(msg);
    console.log(`Booking reminder email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending booking reminder email:', error);
    return false;
  }
}