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
      // Create a new date in Eastern Time to avoid timezone conversion issues
      const easternDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
      return easternDate.toLocaleDateString('en-US', { 
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
        timeZone: 'America/New_York',
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
              <li>Please arrive <strong>on time</strong>. No gum, sunflower seeds or colored drinks</li>
              <li>Only use the space that you rented or you will be billed for the other space that was used</li>
              <li>Bring your own water bottle and towel</li>
              <li>Athletic attire and Tennis shoes or turf shoes NO Cleats!</li>
              <li>Contact us if you need to reschedule or cancel</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; color: #666;">Questions about your booking?</p>
            <p style="margin: 0; font-weight: 600; color: #1e3a5f;">
              📧 info@thebarnmi.com<br>
              📞 (517) 204-4747<br>
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
- Please arrive on time. No gum, sunflower seeds or colored drinks
- Only use the space that you rented or you will be billed for the other space that was used
- Bring your own water bottle and towel
- Athletic attire and Tennis shoes or turf shoes NO Cleats!
- Contact us if you need to reschedule or cancel

Questions? Contact us at:
Email: info@thebarnmi.com
Phone: (517) 204-4747
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
      // Create a new date in Eastern Time to avoid timezone conversion issues
      const easternDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
      return easternDate.toLocaleDateString('en-US', { 
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
        timeZone: 'America/New_York',
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
              <li>Please arrive <strong>on time</strong>. No gum, sunflower seeds or colored drinks</li>
              <li>Only use the space that you rented or you will be billed for the other space that was used</li>
              <li>Bring water bottle and towel</li>
              <li>Wear athletic attire and Tennis shoes or turf shoes NO Cleats!</li>
              <li>Contact us if you need to cancel or reschedule</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; color: #666;">Questions or need to reschedule?</p>
            <p style="margin: 0; font-weight: 600; color: #1e3a5f;">
              📧 info@thebarnmi.com<br>
              📞 (517) 204-4747<br>
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
- Please arrive on time. No gum, sunflower seeds or colored drinks
- Only use the space that you rented or you will be billed for the other space that was used
- Bring water bottle and towel
- Wear athletic attire and Tennis shoes or turf shoes NO Cleats!
- Contact us if you need to cancel or reschedule

Questions or need to reschedule?
Email: info@thebarnmi.com
Phone: (517) 204-4747
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

export async function sendPasswordResetEmail(to: string, customerName: string, resetUrl: string): Promise<boolean> {
  if (!sgMail) {
    console.log('SendGrid not configured, skipping password reset email');
    return false;
  }

  try {
    const msg = {
      to,
      from: 'info@thebarnmi.com',
      subject: 'Reset Your Password - The Barn MI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - The Barn MI</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #e5e5e5; }
            .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>

            <div class="content">
              <h2 style="color: #1e3a8a; margin-bottom: 20px;">Hi ${customerName},</h2>
              
              <p>We received a request to reset the password for your account at The Barn MI.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button" style="color: white;">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">${resetUrl}</p>

              <div class="warning">
                <p style="margin: 0; color: #92400e;"><strong>Important:</strong></p>
                <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will not be changed unless you click the link above</li>
                </ul>
              </div>

              <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
              
              <p>Need help? Contact us at:</p>
              <ul>
                <li>Email: info@thebarnmi.com</li>
                <li>Phone: (517) 204-4747</li>
              </ul>
            </div>

            <div class="footer">
              <p style="margin: 0;">
                <strong>The Barn MI</strong><br>
                6090 W River Rd, Weidman MI 48893<br>
                Professional Baseball Training Facility
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} The Barn MI. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request - The Barn MI

Hi ${customerName},

We received a request to reset the password for your account at The Barn MI.

Click this link to reset your password:
${resetUrl}

IMPORTANT:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will not be changed unless you click the link above

Need help? Contact us:
Email: info@thebarnmi.com
Phone: (517) 204-4747
Address: 6090 W River Rd, Weidman MI 48893

© ${new Date().getFullYear()} The Barn MI. All rights reserved.
      `
    };

    await sgMail.send(msg);
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}