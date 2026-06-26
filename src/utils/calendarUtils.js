// Utility functions for Google Calendar templating and iCal (.ics) exports

/**
 * Formats event dates and optional times to the format required by Google Calendar URL template.
 * Google Calendar uses YYYYMMDDTHHMMSS for local times, or YYYYMMDDTHHMMSSZ for UTC.
 * Since we specify the ctz parameter as America/Edmonton, we format as YYYYMMDDTHHMMSS (local time).
 * All-day events use YYYYMMDD (start date) / YYYYMMDD (exclusive end date).
 */
export function getGoogleCalendarLink(event) {
  const title = encodeURIComponent(event.title || 'Event');
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');
  
  const startVal = event.startDate || event.date;
  const endVal = event.endDate || event.date || startVal;
  
  const startClean = (startVal || '').replace(/-/g, ''); // "2026-07-18" -> "20260718"
  const endClean = (endVal || '').replace(/-/g, '');
  if (!startClean) return '#';

  let datesStr = '';

  if (event.startTime) {
    const timeStartClean = event.startTime.replace(/:/g, ''); // "17:30" -> "1730"
    const timeEndClean = event.endTime ? event.endTime.replace(/:/g, '') : timeStartClean;
    
    // Construct local time range string YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS
    datesStr = `${startClean}T${timeStartClean}00/${endClean}T${timeEndClean}00`;
  } else {
    // All-day event: DTEND must be the day after endVal
    const d = new Date(endVal + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const nextDateClean = `${y}${m}${day}`;
    datesStr = `${startClean}/${nextDateClean}`;
  }

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesStr}&details=${details}&location=${location}`;
  if (event.startTime) {
    url += `&ctz=America/Edmonton`;
  }
  return url;
}

/**
 * Escapes special characters for iCalendar format values (RFC 5545).
 */
function escapeICSField(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Generates and downloads an iCal (.ics) file client-side.
 * Works for both a list of multiple events (bulk export) or a single event.
 */
export function downloadCalendarICS(eventsToExport, filename = 'ucds-club-calendar.ics') {
  if (!eventsToExport || eventsToExport.length === 0) return;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University of Calgary Debate Society//Club Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  eventsToExport.forEach(event => {
    const startVal = event.startDate || event.date;
    const endVal = event.endDate || event.date || startVal;
    
    const startClean = (startVal || '').replace(/-/g, '');
    const endClean = (endVal || '').replace(/-/g, '');
    if (!startClean) return;

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${event.id || Math.random().toString(36).substr(2, 9)}@ucds.ca`);
    
    // DTSTAMP needs to be UTC
    const now = new Date();
    const nowUTC = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    icsLines.push(`DTSTAMP:${nowUTC}`);

    if (event.startTime) {
      const timeStartClean = event.startTime.replace(/:/g, '');
      const timeEndClean = event.endTime ? event.endTime.replace(/:/g, '') : timeStartClean;
      
      icsLines.push(`DTSTART;TZID=America/Edmonton:${startClean}T${timeStartClean}00`);
      icsLines.push(`DTEND;TZID=America/Edmonton:${endClean}T${timeEndClean}00`);
    } else {
      // All-day event
      icsLines.push(`DTSTART;VALUE=DATE:${startClean}`);
      
      const d = new Date(endVal + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      icsLines.push(`DTEND;VALUE=DATE:${y}${m}${day}`);
    }

    icsLines.push(`SUMMARY:${escapeICSField(event.title || 'Event')}`);
    if (event.description) {
      icsLines.push(`DESCRIPTION:${escapeICSField(event.description)}`);
    }
    if (event.location) {
      icsLines.push(`LOCATION:${escapeICSField(event.location)}`);
    }
    if (event.link) {
      icsLines.push(`URL:${event.link}`);
    }
    if (event.category) {
      icsLines.push(`CATEGORIES:${event.category.toUpperCase()}`);
    }
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
