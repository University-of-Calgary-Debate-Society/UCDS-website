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
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

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

  // Navigation helpers based on view mode
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar math calculations (Month View)
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

  // Calendar math calculations (Week View)
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekSlots = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    weekSlots.push({
      date: dayDate,
      dayNum: dayDate.getDate(),
      month: dayDate.getMonth(),
      year: dayDate.getFullYear(),
      isCurrentMonth: dayDate.getMonth() === currentDate.getMonth(),
      dateKey: getSlotDateKey(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
    });
  }

  // Formatting Date Helper for Slot Keys
  function getSlotDateKey(slotYear, slotMonth, slotDayNum) {
    const adjustedDate = new Date(slotYear, slotMonth, slotDayNum);
    const y = adjustedDate.getFullYear();
    const m = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const d = String(adjustedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

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

  const getWeekRangeLabel = (start) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    if (start.getFullYear() !== end.getFullYear()) {
      return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (startMonth !== endMonth) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  };

  const getDayLabel = (date) => {
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getHeaderDateLabel = () => {
    if (viewMode === 'month') {
      return `${formatMonthName(month)} ${year}`;
    } else if (viewMode === 'week') {
      return getWeekRangeLabel(startOfWeek);
    } else {
      return getDayLabel(currentDate);
    }
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

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Local helper today check
  const isToday = (slotDateKey) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}` === slotDateKey;
  };

  const activeDayKey = getSlotDateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const activeDayEvents = getEventsForDate(activeDayKey);

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
                <button onClick={handlePrev} className="calendar-nav-btn">&larr; Prev</button>
                <div className="calendar-current-month">
                  {getHeaderDateLabel()}
                </div>
                <button onClick={handleNext} className="calendar-nav-btn">Next &rarr;</button>
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

              {/* View Selector */}
              <div className="calendar-view-selector">
                <button onClick={() => setViewMode('month')} className={`calendar-view-btn ${viewMode === 'month' ? 'active' : ''}`}>Month</button>
                <button onClick={() => setViewMode('week')} className={`calendar-view-btn ${viewMode === 'week' ? 'active' : ''}`}>Week</button>
                <button onClick={() => setViewMode('day')} className={`calendar-view-btn ${viewMode === 'day' ? 'active' : ''}`}>Day</button>
              </div>

              {/* Category filters */}
              <div className="calendar-filter-bar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`calendar-filter-chip ${filterCategory === cat.id ? 'active' : ''}`}
                    style={filterCategory === cat.id ? { background: cat.color, borderColor: cat.color, color: '#ffffff' } : {}}
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
                
                {viewMode === 'month' && (
                  <>
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
                  </>
                )}

                {viewMode === 'week' && (
                  <>
                    {/* Weekday headers */}
                    <div className="calendar-grid-header">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                        const slot = weekSlots[i];
                        return (
                          <div key={d} className="calendar-grid-header-day">
                            {d} <span style={{ opacity: 0.7, fontSize: '0.8rem', fontWeight: 600 }}>({slot.dayNum})</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Week cells grid */}
                    <div className="calendar-grid-days">
                      {weekSlots.map((slot, index) => {
                        const slotDateKey = slot.dateKey;
                        const dayEvents = getEventsForDate(slotDateKey);
                        const cellToday = isToday(slotDateKey);

                        return (
                          <div
                            key={index}
                            onClick={() => handleCellClick(slotDateKey)}
                            className={`calendar-day-cell week-cell ${cellToday ? 'today' : ''}`}
                          >
                            <span className="calendar-day-number">{slot.dayNum}</span>
                            
                            {/* Event tags */}
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
                  </>
                )}

                {viewMode === 'day' && (
                  <div className="calendar-day-view-container">
                    <div className="day-view-header">
                      <h3>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                      <span className="day-view-event-count">
                        {activeDayEvents.length} {activeDayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>

                    <div className="day-view-events-list">
                      {activeDayEvents.length === 0 ? (
                        <div className="day-view-empty">
                          <p>No events scheduled for this day.</p>
                        </div>
                      ) : (
                        activeDayEvents.map(event => (
                          <article key={event.id} className={`day-view-event-card cat-${event.category || 'other'}`}>
                            <div className="day-view-card-left">
                              {event.imageUrl && (
                                <div className="day-view-event-banner" style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '8px', marginBottom: '1rem' }}>
                                  <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                              <span className="day-view-category-badge" style={{ color: CATEGORIES.find(c => c.id === event.category)?.color || '#64748b' }}>
                                {event.category}
                              </span>
                              <h4 className="day-view-title">{event.title}</h4>
                              {event.description && <p className="day-view-desc">{event.description}</p>}
                            </div>

                            <div className="day-view-card-right">
                              {event.startTime && (
                                <div className="day-view-meta-row">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''} {event.timezone || 'MST'}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="day-view-meta-row">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{event.location}</span>
                                </div>
                              )}
                              
                              <div className="day-view-actions">
                                {event.link && (
                                  <a href={event.link} target="_blank" rel="noreferrer" className="day-view-btn">
                                    More Info
                                  </a>
                                )}
                                <a 
                                  href={getGoogleCalendarLink(event)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="day-view-btn google-cal"
                                >
                                  + Google
                                </a>
                                <button 
                                  onClick={() => downloadCalendarICS([event], `${event.title || 'event'}.ics`)} 
                                  className="day-view-btn ics-export"
                                >
                                  Export (.ics)
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                )}

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
                  {event.imageUrl && (
                    <div className="drawer-event-image-wrapper" style={{ width: '100%', height: '180px', overflow: 'hidden', borderRadius: '8px', marginBottom: '1.25rem' }}>
                      <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <h3 className="drawer-event-title">{event.title}</h3>
                  
                  <div className="drawer-event-meta">
                    {event.startDate && event.endDate && event.startDate !== event.endDate && (
                      <span className="drawer-event-meta-item" style={{ color: '#60a5fa' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span style={{ fontWeight: 'bold' }}>{formatEventDate(event.startDate)} to {formatEventDate(event.endDate)}</span>
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
