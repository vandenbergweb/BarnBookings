import { google } from 'googleapis';
import type { Booking, Space, Bundle, User } from '@shared/schema';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

function formatTimeToEST(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateToEST(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export async function createBookingCalendarEvent(
  booking: Booking,
  user: User,
  space?: Space | null,
  bundle?: Bundle | null
): Promise<string | null> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const itemName = space?.name || bundle?.name || 'Unknown';
    const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    
    const summary = `${itemName} - ${customerName}`;
    
    const description = [
      `Customer: ${customerName}`,
      `Email: ${user.email}`,
      `Booking ID: ${booking.id}`,
      ``,
      `Space/Bundle: ${itemName}`,
      space?.description ? `Description: ${space.description}` : '',
      bundle?.description ? `Description: ${bundle.description}` : '',
      ``,
      `Total: $${booking.totalAmount}`,
      `Payment: ${booking.paymentMethod === 'stripe' ? 'Paid via Stripe' : booking.paymentMethod || 'N/A'}`,
      `Status: ${booking.status}`,
      ``,
      `Facility: The Barn MI`,
      `Address: 6090 W River Rd, Weidman MI 48893`,
      `Phone: (517) 204-4747`
    ].filter(Boolean).join('\n');

    const event = {
      summary,
      description,
      location: '6090 W River Rd, Weidman MI 48893',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      colorId: space ? '9' : '10',
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Google Calendar event created:', response.data.id);
    return response.data.id || null;
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    return null;
  }
}

export async function listUpcomingEvents(maxResults: number = 10): Promise<any[]> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Failed to list Google Calendar events:', error);
    return [];
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    console.log('Google Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return false;
  }
}

export async function testCalendarConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const response = await calendar.calendarList.list({
      maxResults: 1,
    });

    if (response.data.items && response.data.items.length > 0) {
      return { 
        success: true, 
        message: `Connected to Google Calendar. Primary calendar: ${response.data.items[0].summary}` 
      };
    }
    
    return { success: true, message: 'Connected to Google Calendar' };
  } catch (error: any) {
    console.error('Google Calendar connection test failed:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to connect to Google Calendar' 
    };
  }
}
