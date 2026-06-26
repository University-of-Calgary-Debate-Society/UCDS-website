import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useDialog } from '../../context/DialogContext';

const CATEGORIES = [
  { id: 'practice', label: 'Practice' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'social', label: 'Social' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'other', label: 'Other' }
];

export default function CalendarManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [currentEventId, setCurrentEventId] = useState(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('practice');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Recurrence states (creation mode only)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [customWeeks, setCustomWeeks] = useState(2);
  const [repeatUntil, setRepeatUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  // Track original recurrence info for series updates
  const [originalEventGroupId, setOriginalEventGroupId] = useState(null);
  const [originalEventStartDate, setOriginalEventStartDate] = useState(null);

  // Auth gate
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'calendar_events'));
      const snapshot = await getDocs(q);
      const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort chronologically by startDate (falling back to date)
      allEvents.sort((a, b) => {
        const startA = a.startDate || a.date || '';
        const startB = b.startDate || b.date || '';
        return startA.localeCompare(startB);
      });
      
      setEvents(allEvents);
    } catch (err) {
      console.error("Error fetching calendar events", err);
      alert("Failed to load calendar events from database.");
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Recurrence occurrences generator
  const generateRecurringDates = (startStr, endStr, type, weeksInterval, untilStr) => {
    const occurrences = [];
    const start = new Date(startStr + 'T00:00:00');
    const limit = new Date(untilStr + 'T23:59:59');
    
    // Event duration in days (for multi-day recurring events)
    const sDate = new Date(startStr + 'T00:00:00');
    const eDate = new Date(endStr + 'T00:00:00');
    const durationDays = Math.round((eDate - sDate) / (1000 * 60 * 60 * 24)) || 0;
    
    let current = new Date(start);
    let count = 0;
    
    while (current <= limit && count < 50) {
      const y1 = current.getFullYear();
      const m1 = String(current.getMonth() + 1).padStart(2, '0');
      const d1 = String(current.getDate()).padStart(2, '0');
      const occStart = `${y1}-${m1}-${d1}`;
      
      const currentEnd = new Date(current);
      currentEnd.setDate(currentEnd.getDate() + durationDays);
      const y2 = currentEnd.getFullYear();
      const m2 = String(currentEnd.getMonth() + 1).padStart(2, '0');
      const d2 = String(currentEnd.getDate()).padStart(2, '0');
      const occEnd = `${y2}-${m2}-${d2}`;
      
      occurrences.push({
        startDate: occStart,
        endDate: occEnd
      });
      
      if (type === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (type === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else if (type === 'custom_weeks') {
        const weeks = parseInt(weeksInterval, 10) || 2;
        current.setDate(current.getDate() + (weeks * 7));
      } else {
        break;
      }
      count++;
    }
    return occurrences;
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      alert("Please provide an Event Title and Start Date.");
      return;
    }

    if (isMultiDay && endDate && endDate < startDate) {
      alert("Impossible date configuration: End Date cannot be before the Start Date.");
      return;
    }

    const actualEndDate = isMultiDay ? (endDate || startDate) : startDate;

    if (startDate === actualEndDate && startTime && endTime && endTime < startTime) {
      alert("Impossible time configuration: End Time cannot be before the Start Time on the same day.");
      return;
    }

    if (isRecurring && repeatUntil < startDate) {
      alert("Impossible recurrence configuration: 'Repeat Until' date cannot be before the Start Date.");
      return;
    }

    try {
      const basePayload = {
        title: title.trim(),
        startDate: startDate,
        endDate: actualEndDate,
        date: startDate, // legacy compatibility
        startTime: startTime.trim() || '',
        endTime: endTime.trim() || '',
        timezone: 'MST',
        category: category,
        location: location.trim() || '',
        description: description.trim() || '',
        link: link.trim() || '',
        imageUrl: imageUrl.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (currentEventId) {
        // Edit mode
        if (originalEventGroupId) {
          const updateAll = await confirm("This event is part of a recurring series. Would you like to update ALL future occurrences in this series? (Click 'Cancel' to update this occurrence only.)");
          
          if (updateAll) {
            setLoading(true);
            // Fetch all occurrences in series
            const q = query(collection(db, 'calendar_events'), where('recurrenceGroupId', '==', originalEventGroupId));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            
            let updatedCount = 0;
            snapshot.docs.forEach(docSnap => {
              const data = docSnap.data();
              const start = data.startDate || data.date;
              if (start >= originalEventStartDate) {
                batch.update(docSnap.ref, {
                  title: basePayload.title,
                  startTime: basePayload.startTime,
                  endTime: basePayload.endTime,
                  category: basePayload.category,
                  location: basePayload.location,
                  description: basePayload.description,
                  link: basePayload.link,
                  imageUrl: basePayload.imageUrl,
                  updatedAt: new Date().toISOString()
                });
                updatedCount++;
              }
            });
            
            await batch.commit();
            alert(`Successfully updated ${updatedCount} events in the recurring series!`);
          } else {
            // Update only this occurrence
            await updateDoc(doc(db, 'calendar_events', currentEventId), basePayload);
            alert("This occurrence updated successfully!");
          }
        } else {
          // Regular single event update
          await updateDoc(doc(db, 'calendar_events', currentEventId), basePayload);
          alert("Calendar event updated successfully!");
        }
      } else {
        // Creation mode
        if (isRecurring) {
          const occurrences = generateRecurringDates(startDate, endDate || startDate, recurrenceType, customWeeks, repeatUntil);
          if (occurrences.length === 0) {
            alert("No occurrence dates generated. Please verify 'Repeat Until' is after the 'Start Date'.");
            return;
          }
          
          const recurrenceGroupId = 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
          const batch = writeBatch(db);
          
          occurrences.forEach(occ => {
            const docRef = doc(collection(db, 'calendar_events'));
            batch.set(docRef, {
              ...basePayload,
              startDate: occ.startDate,
              endDate: occ.endDate,
              date: occ.startDate,
              recurrenceGroupId: recurrenceGroupId,
              createdAt: new Date().toISOString()
            });
          });
          
          await batch.commit();
          alert(`Successfully scheduled recurring series with ${occurrences.length} events!`);
        } else {
          // Single event creation
          basePayload.createdAt = new Date().toISOString();
          await addDoc(collection(db, 'calendar_events'), basePayload);
          alert("Calendar event scheduled successfully!");
        }
      }

      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("Error saving calendar event", err);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleEditEvent = (evt) => {
    setCurrentEventId(evt.id);
    setTitle(evt.title || '');
    const startVal = evt.startDate || evt.date || new Date().toISOString().split('T')[0];
    const endVal = evt.endDate || evt.date || evt.startDate || new Date().toISOString().split('T')[0];
    setStartDate(startVal);
    setEndDate(endVal);
    setIsMultiDay(startVal !== endVal);
    setStartTime(evt.startTime || '');
    setEndTime(evt.endTime || '');
    setCategory(evt.category || 'practice');
    setLocation(evt.location || '');
    setDescription(evt.description || '');
    setLink(evt.link || '');
    setImageUrl(evt.imageUrl || '');
    
    setOriginalEventGroupId(evt.recurrenceGroupId || null);
    setOriginalEventStartDate(evt.startDate || evt.date || null);
    setIsRecurring(false); // Hide recurrence toggle during edit

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEvent = async (id) => {
    const clickedEvent = events.find(e => e.id === id);
    const groupId = clickedEvent?.recurrenceGroupId;
    const eventStart = clickedEvent?.startDate || clickedEvent?.date;

    if (groupId) {
      const deleteAll = await confirm("This event is part of a recurring series. Would you like to delete ALL future occurrences in this series? (Click 'Cancel' to delete this occurrence only.)");
      
      if (deleteAll) {
        setLoading(true);
        try {
          const q = query(collection(db, 'calendar_events'), where('recurrenceGroupId', '==', groupId));
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          
          let deletedCount = 0;
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const start = data.startDate || data.date;
            if (start >= eventStart) {
              batch.delete(docSnap.ref);
              deletedCount++;
            }
          });
          
          await batch.commit();
          alert(`Successfully deleted ${deletedCount} events in the recurring series!`);
          fetchEvents();
          return;
        } catch (err) {
          console.error("Error deleting recurring series", err);
          alert("Failed to delete recurring series.");
          setLoading(false);
          return;
        }
      }
    }

    // Default single delete
    if (!await confirm("Are you sure you want to delete this calendar event?")) return;
    try {
      await deleteDoc(doc(db, 'calendar_events', id));
      alert("Calendar event deleted successfully!");
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event", err);
      alert("Failed to delete event.");
    }
  };

  const resetForm = () => {
    setCurrentEventId(null);
    setTitle('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setIsMultiDay(false);
    setStartTime('');
    setEndTime('');
    setCategory('practice');
    setLocation('');
    setDescription('');
    setLink('');
    setImageUrl('');
    setIsRecurring(false);
    setRecurrenceType('weekly');
    setCustomWeeks(2);
    setRepeatUntil(() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      return d.toISOString().split('T')[0];
    });
    setOriginalEventGroupId(null);
    setOriginalEventStartDate(null);
  };

  return (
    <div className="manager-wrapper">
      <div className="calendar-manager-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="manager-header" style={{ animation: 'fadeInDown 0.4s ease-out' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Calendar Events Manager
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Schedule practices, tournaments, socials, and recurring series.</p>
          </div>
          <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', transition: 'all 0.25s ease' }}>
            Back to Dashboard
          </Link>
        </div>

        {/* Manager Grid Layout */}
        <div className="calendar-manager-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2.25rem', marginTop: '1.5rem' }}>
          
          {/* Form Card */}
          <div className="manager-form-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2.25rem', borderRadius: '16px', backdropFilter: 'blur(12px)', alignSelf: 'start', transition: 'all 0.3s ease' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#60a5fa', fontSize: '1.5rem', fontWeight: 700 }}>
              {currentEventId ? 'Edit Event' : 'Add New Event'}
            </h3>
            
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Event Title *</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Wednesday Novice Seminar" 
                  className="exec-input-premium"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={isMultiDay} 
                  onChange={e => setIsMultiDay(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Multi-day Event?
              </div>

              <div className="manager-form-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Start Date *</label>
                  <input 
                    type="date" 
                    required
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="exec-input-premium"
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
                {isMultiDay && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', animation: 'fadeInUp 0.2s ease-out' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="exec-input-premium"
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Recurrence Options (Only shown when creating new events) */}
              {!currentEventId && (
                <div style={{ padding: '1rem', background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={isRecurring} 
                      onChange={e => setIsRecurring(e.target.checked)} 
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Is Recurring Event?
                  </label>

                  {isRecurring && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeInUp 0.25s ease-out' }}>
                      <div className="manager-form-row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Frequency</label>
                          <select
                            value={recurrenceType}
                            onChange={e => setRecurrenceType(e.target.value)}
                            className="exec-input-premium"
                            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="weekly" style={{ background: '#0f172a' }}>Weekly</option>
                            <option value="monthly" style={{ background: '#0f172a' }}>Monthly</option>
                            <option value="custom_weeks" style={{ background: '#0f172a' }}>Every X Weeks</option>
                          </select>
                        </div>
                        {recurrenceType === 'custom_weeks' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', animation: 'fadeInUp 0.2s' }}>
                            <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Repeat Every (weeks)</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="12"
                              value={customWeeks} 
                              onChange={e => setCustomWeeks(e.target.value)}
                              className="exec-input-premium"
                              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Repeat Until (End date of recurrence)</label>
                        <input 
                          type="date" 
                          required={isRecurring}
                          value={repeatUntil} 
                          onChange={e => setRepeatUntil(e.target.value)}
                          className="exec-input-premium"
                          style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="manager-form-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Start Time</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    className="exec-input-premium"
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>End Time</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                    className="exec-input-premium"
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              </div>

              <div className="manager-form-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Event Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="exec-input-premium"
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ background: '#0f172a' }}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Location</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. CHE 110 or Zoom" 
                    className="exec-input-premium"
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Info Link URL</label>
                <input 
                  type="text" 
                  value={link} 
                  onChange={e => setLink(e.target.value)} 
                  placeholder="https://..." 
                  className="exec-input-premium"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Event Image URL</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  placeholder="https://.../image.jpg (Optional)" 
                  className="exec-input-premium"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Event Description</label>
                <textarea 
                  rows="3" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Details about the session..." 
                  className="exec-input-premium"
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#ffffff', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="exec-btn exec-btn-primary" style={{ flex: 1, padding: '0.75rem 1.5rem', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', color: '#ffffff', cursor: 'pointer', fontWeight: 600, transition: 'all 0.25s ease' }}>
                  {currentEventId ? 'Save Changes' : 'Add Event'}
                </button>
                {currentEventId && (
                  <button type="button" onClick={resetForm} className="exec-btn exec-btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', cursor: 'pointer', transition: 'all 0.25s ease' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Directory Card */}
          <div className="manager-directory-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '2.25rem', borderRadius: '16px', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease' }}>
            <h3 style={{ color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 700, fontSize: '1.5rem' }}>Scheduled Events</h3>
            
            {loading ? (
              <p style={{ color: '#cbd5e1', padding: '1rem 0' }}>Loading events...</p>
            ) : (() => {
              const seenGroups = new Set();
              const displayedEvents = events.filter(evt => {
                if (!evt.recurrenceGroupId) return true;
                if (seenGroups.has(evt.recurrenceGroupId)) return false;
                seenGroups.add(evt.recurrenceGroupId);
                return true;
              });

              if (displayedEvents.length === 0) {
                return <p style={{ color: '#94a3b8', padding: '1rem 0', fontStyle: 'italic' }}>No calendar events scheduled yet. Create an event to populate the database.</p>;
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '720px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {displayedEvents.map((evt, idx) => {
                    const start = evt.startDate || evt.date;
                    const end = evt.endDate || evt.date || start;
                    const isMultiDay = start !== end;

                  return (
                    <div 
                      key={evt.id} 
                      className="manager-post-row" 
                      style={{ 
                        alignItems: 'center', 
                        animation: `fadeInUp 0.3s ease-out forwards`,
                        animationDelay: `${idx * 0.03}s`,
                        opacity: 0,
                        transform: 'translateY(10px)',
                        padding: '1.25rem'
                      }}
                    >
                      <div className="manager-post-info" style={{ gap: '1.25rem' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: evt.category === 'practice' ? '#3b82f6' : 
                                 evt.category === 'tournament' ? '#f97316' :
                                 evt.category === 'social' ? '#22c55e' :
                                 evt.category === 'meeting' ? '#8b5cf6' : '#14b8a6',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                        }}>
                          <span>{evt.category?.toUpperCase()?.slice(0, 4)}</span>
                        </div>
                        
                        <div className="manager-post-details">
                          <h4 style={{ margin: '0 0 0.35rem', color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                            {evt.title} 
                            {evt.recurrenceGroupId && (
                              <span style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '0.5rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.25)', textTransform: 'uppercase', fontWeight: 700 }}>
                                🔁 Recurring
                              </span>
                            )}
                          </h4>
                          <p style={{ margin: '0 0 0.25rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                            📅 {isMultiDay ? `${start} to ${end}` : start} {evt.startTime ? `• ⏰ ${evt.startTime} ${evt.endTime ? `- ${evt.endTime}` : ''} ${evt.timezone || 'MST'}` : ''}
                          </p>
                          {evt.location && (
                            <p style={{ margin: '0 0 0.25rem', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>📍 {evt.location}</p>
                          )}
                        </div>
                      </div>

                      <div className="manager-post-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEditEvent(evt)} className="exec-btn exec-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', cursor: 'pointer', fontWeight: 650, transition: 'all 0.2s ease' }}>Edit</button>
                        <button onClick={() => handleDeleteEvent(evt.id)} className="exec-btn exec-btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', cursor: 'pointer', fontWeight: 650, transition: 'all 0.2s ease' }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )})()}
          </div>

        </div>
      </div>
    </div>
  );
}
