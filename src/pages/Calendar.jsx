import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/calendar.css';
import { getGoogleCalendarLink, downloadCalendarICS } from '../utils/calendarUtils';

const CATEGORIES = [
  { id: 'all', label: 'All Events', color: '#64748b' },
  { id: 'practice', label: 'Practices', color: '#3b82f6' },
  { id: 'tournament', label: 'Tournaments', color: '#f97316' },
  { id: 'social', label: 'Socials', color: '#22c55e' },
  { id: 'meeting', label: 'Meetings', color: '#8b5cf6' },
  { id: 'other', label: 'Other', color: '#14b8a6' }
];

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Real-time listener on Firestore calendar_events
  useEffect(() => {
    const q = query(collection(db, 'calendar_events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(allEvents);
      setLoading(false);
    }, (err) => {
      console.error("Error loading calendar events real-time:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar math calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
  
  // Previous month padding days
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const paddingDaysStart = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    paddingDaysStart.push({
      dayNum: prevMonthDaysCount - i,
      isCurrentMonth: false,
      monthOffset: -1
    });
  }

  // Active month days
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      dayNum: i,
      isCurrentMonth: true,
      monthOffset: 0
    });
  }

  // Next month padding days to fill 6-week layout (42 slots total)
  const totalSlots = 42;
  const paddingDaysEnd = [];
  const slotsRemaining = totalSlots - (paddingDaysStart.length + currentMonthDays.length);
  for (let i = 1; i <= slotsRemaining; i++) {
    paddingDaysEnd.push({
      dayNum: i,
      isCurrentMonth: false,
      monthOffset: 1
    });
  }

  const allGridSlots = [...paddingDaysStart, ...currentMonthDays, ...paddingDaysEnd];

  const getEventsForDate = (slotDateKey) => {
    return events.filter(event => {
      const start = event.startDate || event.date;
      const end = event.endDate || event.date || start;
      if (!start) return false;
      if (slotDateKey < start || slotDateKey > end) return false;
      if (filterCategory !== 'all' && event.category !== filterCategory) return false;
      return true;
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const handleCellClick = (slotDateKey) => {
    setSelectedDateKey(slotDateKey);
    setIsDrawerOpen(true);
  };

  const formatMonthName = (monthIdx) => {
    return new Date(2026, monthIdx, 1).toLocaleString('default', { month: 'long' });
  };

  // Date formatter helper: 2026-06-25
  const getSlotDateKey = (slotYear, slotMonth, slotDayNum) => {
    const adjustedDate = new Date(slotYear, slotMonth, slotDayNum);
    const y = adjustedDate.getFullYear();
    const m = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const d = String(adjustedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Details drawer content
  const selectedDateEvents = selectedDateKey ? events.filter(event => {
    const start = event.startDate || event.date;
    const end = event.endDate || event.date || start;
    if (!start) return false;
    return selectedDateKey >= start && selectedDateKey <= end;
  }) : [];
  const selectedDateObject = selectedDateKey ? new Date(selectedDateKey + 'T00:00:00') : null;
  const formattedSelectedDate = selectedDateObject 
    ? selectedDateObject.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // Local helper today check
  const isToday = (slotDateKey) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}` === slotDateKey;
  };

  return (
    <main>
      <section className="section" style={{ minHeight: '100vh', background: '#0b1a3a' }}>
        <div className="container" style={{ paddingTop: '8rem' }}>
          
          <div className="section-header straddle">
            <h1 className="title-box"><span>Club Calendar</span></h1>
          </div>

          <div className="calendar-page-container">
            
            {/* Header Navigation panel */}
            <div className="calendar-header-panel">
              <div className="calendar-month-nav">
                <button onClick={handlePrevMonth} className="calendar-nav-btn">&larr; Prev</button>
                <div className="calendar-current-month">
                  {formatMonthName(month)} {year}
                </div>
                <button onClick={handleNextMonth} className="calendar-nav-btn">Next &rarr;</button>
                <button onClick={handleResetToday} className="calendar-nav-btn" style={{ marginLeft: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>Today</button>
                <button 
                  onClick={() => downloadCalendarICS(events)} 
                  className="calendar-nav-btn" 
                  style={{ 
                    marginLeft: '0.5rem', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderColor: 'rgba(16, 185, 129, 0.3)', 
                    color: '#34d399' 
                  }}
                >
                  Export All (.ics)
                </button>
              </div>

              {/* Category filters */}
              <div className="calendar-filter-bar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`calendar-filter-chip ${filterCategory === cat.id ? 'active' : ''}`}
                    style={filterCategory === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '4rem 0', color: '#cbd5e1', fontSize: '1.2rem' }}>Loading calendar events...</p>
            ) : (
              <div className="calendar-grid-wrapper">
                
                {/* Weekday headers */}
                <div className="calendar-grid-header">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="calendar-grid-header-day">{d}</div>
                  ))}
                </div>

                {/* Day cells grid */}
                <div className="calendar-grid-days">
                  {allGridSlots.map((slot, index) => {
                    const slotDateKey = getSlotDateKey(year, month + slot.monthOffset, slot.dayNum);
                    const dayEvents = getEventsForDate(slotDateKey);
                    const cellToday = isToday(slotDateKey);

                    return (
                      <div
                        key={index}
                        onClick={() => handleCellClick(slotDateKey)}
                        className={`calendar-day-cell ${!slot.isCurrentMonth ? 'inactive' : ''} ${cellToday ? 'today' : ''}`}
                      >
                        <span className="calendar-day-number">{slot.dayNum}</span>
                        
                        {/* Event tags (Desktop view) */}
                        <div className="calendar-day-events">
                          {dayEvents.map(event => (
                            <span 
                              key={event.id} 
                              className={`calendar-event-tag cat-${event.category || 'other'}`}
                              title={`${event.startTime ? `${event.startTime} ${event.timezone || 'MST'} ` : ''}${event.title}`}
                            >
                              {event.startTime ? `${event.startTime} ` : ''}{event.title}
                            </span>
                          ))}
                        </div>

                        {/* Event dots (Mobile view) */}
                        <div className="calendar-event-dots-mobile">
                          {dayEvents.map(event => (
                            <span 
                              key={event.id} 
                              className={`calendar-event-dot cat-${event.category || 'other'}`}
                              style={{ background: CATEGORIES.find(c => c.id === event.category)?.color || '#14b8a6' }}
                            />
                          ))}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>
      </section>

      {/* Details Side-Drawer Panel */}
      <div 
        onClick={() => setIsDrawerOpen(false)}
        className={`calendar-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
      >
        <div 
          onClick={e => e.stopPropagation()} 
          className="calendar-drawer"
        >
          <button onClick={() => setIsDrawerOpen(false)} className="calendar-drawer-close">&times;</button>
          
          <div>
            <h2 style={{ fontSize: '1.85rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Events List</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>{formattedSelectedDate}</p>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}></div>

          <div className="drawer-events-list">
            {selectedDateEvents.length === 0 ? (
              <p style={{ color: '#94a3b8', margin: '2rem 0', textAlign: 'center', fontStyle: 'italic' }}>No events scheduled for this day.</p>
            ) : (
              selectedDateEvents.map(event => (
                <article key={event.id} className={`drawer-event-card cat-${event.category || 'other'}`}>
                  <h3 className="drawer-event-title">{event.title}</h3>
                  
                  <div className="drawer-event-meta">
                    {event.startDate && event.endDate && event.startDate !== event.endDate && (
                      <span className="drawer-event-meta-item" style={{ color: '#60a5fa' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span style={{ fontWeight: 'bold' }}>{event.startDate} to {event.endDate}</span>
                      </span>
                    )}
                    {event.startTime && (
                      <span className="drawer-event-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''} {event.timezone || 'MST'}</span>
                      </span>
                    )}
                    {event.location && (
                      <span className="drawer-event-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </span>
                    )}
                    <span className="drawer-event-meta-item">
                      <span style={{ 
                        textTransform: 'uppercase', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: CATEGORIES.find(c => c.id === event.category)?.color || '#cbd5e1' 
                      }}>
                        {event.category}
                      </span>
                    </span>
                  </div>

                  {event.description && (
                    <p className="drawer-event-desc">{event.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noreferrer" className="drawer-event-btn">
                        More Information
                      </a>
                    )}
                    <a 
                      href={getGoogleCalendarLink(event)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="drawer-event-btn"
                      style={{ 
                        background: 'rgba(66, 133, 244, 0.15)', 
                        color: '#60a5fa', 
                        border: '1px solid rgba(66, 133, 244, 0.3)' 
                      }}
                    >
                      + Google Calendar
                    </a>
                    <button 
                      onClick={() => downloadCalendarICS([event], `${event.title || 'event'}.ics`)} 
                      className="drawer-event-btn"
                      style={{ 
                        background: 'rgba(244, 63, 94, 0.15)', 
                        color: '#fb7185', 
                        border: '1px solid rgba(244, 63, 94, 0.3)', 
                        cursor: 'pointer' 
                      }}
                    >
                      Export (.ics)
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
