import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function EventManager() {
  const navigate = useNavigate();
  const { alert } = useDialog();

  // Authentication gate
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Form Section State
  const [activeSection, setActiveSection] = useState(1);
  const [showUnderDev, setShowUnderDev] = useState(true);
  const [maxVisited, setMaxVisited] = useState(1);

  // SECTION 1: Dates & Format
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('BP'); // CP, CNDF, BP, Australs
  const [modality, setModality] = useState('online'); // online, in-person
  const [onlineLink, setOnlineLink] = useState('');
  const [venueLocation, setVenueLocation] = useState('');
  const [hostedByUCalgary, setHostedByUCalgary] = useState(false);

  // SECTION 2: Timezone & Schedule
  const [timezone, setTimezone] = useState('MST');
  const [inRoundsCount, setInRoundsCount] = useState(5);
  const [outRoundsCount, setOutRoundsCount] = useState(3);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [dayStartTimes, setDayStartTimes] = useState({});
  // Form variables for adding manual activity
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDay, setNewActivityDay] = useState(1);
  const [newActivityDuration, setNewActivityDuration] = useState('30 mins');

  // SECTION 3: Eligibility
  const [levels, setLevels] = useState({
    university: false,
    highschool: false,
    juniorhigh: false
  });
  const [categories, setCategories] = useState({
    open: false,
    beginner: false
  });

  // SECTION 4: CUSID & Location Details
  const [cusidTag, setCusidTag] = useState(''); // West, East, Central, National, International, Intervarsity
  const [scope, setScope] = useState('canadian'); // canadian, international
  const [hostingUniversity, setHostingUniversity] = useState('University of Calgary');
  const [country, setCountry] = useState('Canada');

  // SECTION 5: Image Uploads
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState('');
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const tabsContainerRef = useRef(null);

  // SECTION 6: Automatic Form Generation Config
  const [formFields, setFormFields] = useState([
    { id: 'firstName', label: 'First Name', type: 'text', required: true },
    { id: 'lastName', label: 'Last Name', type: 'text', required: true },
    { id: 'emailAddress', label: 'Email Address', type: 'text', required: true }
  ]);
  const [signupType, setSignupType] = useState('individual'); // individual, team, institution
  const [requireGuardian, setRequireGuardian] = useState(false);
  const [askAllergies, setAskAllergies] = useState(false);
  const [askExperience, setAskExperience] = useState(false);

  // SECTION 7: Fees & Payment
  const [paymentMethods, setPaymentMethods] = useState({
    etransfer: true,
    stripe: false,
    cashcheque: false,
    paypal: false
  });
  const [pricePerDebater, setPricePerDebater] = useState(0);
  const [pricePerJudge, setPricePerJudge] = useState(0);
  const [noJudgeFeeEnabled, setNoJudgeFeeEnabled] = useState(false);
  const [noJudgeFeeAmount, setNoJudgeFeeAmount] = useState(0);

  // Track maxVisited for progressive tabs
  useEffect(() => {
    if (activeSection > maxVisited) {
      setMaxVisited(activeSection);
    }
  }, [activeSection, maxVisited]);

  // Auto-scroll active tab into view and scroll page to top on section transitions
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeBtn = tabsContainerRef.current.querySelector(`button:nth-child(${activeSection})`);
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  // EDITING & EVENT LISTING STATE
  const [existingEvents, setExistingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentEditDay, setCurrentEditDay] = useState(1);
  const [newPoolActivityName, setNewPoolActivityName] = useState('');
  const [newPoolActivityDuration, setNewPoolActivityDuration] = useState('1hr 30mins');
  const [newPoolActivityType, setNewPoolActivityType] = useState('round');

  const fetchExistingEvents = async () => {
    setLoadingEvents(true);
    try {
      const snapshot = await getDocs(collection(db, 'tournaments_and_events'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
      setExistingEvents(list);
    } catch (err) {
      console.error("Error fetching existing events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchExistingEvents();
  }, []);

  // Handle start editing an event
  const handleStartEdit = (event) => {
    setEditingEvent({
      ...event,
      // Ensure arrays/objects exist
      levels: event.levels || [],
      categories: event.categories || [],
      paymentMethods: event.paymentMethods || [],
      schedule: event.schedule || []
    });
    setCurrentEditDay(1);
    // Scroll smoothly to edit section
    setTimeout(() => {
      const element = document.getElementById('event-edit-panel');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Helper to get number of days in the event being edited
  const getEditDaysCount = () => {
    if (!editingEvent?.startDate || !editingEvent?.endDate) return 1;
    const start = new Date(editingEvent.startDate);
    const end = new Date(editingEvent.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  };

  // Drag and Drop handlers for schedule editing
  const handleDragStartEdit = (e, activityId) => {
    e.dataTransfer.setData('text/plain', activityId);
  };

  const handleDropToDayBox = (e) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData('text/plain');
    if (!activityId || !editingEvent) return;

    const updatedSchedule = editingEvent.schedule.map(item => {
      if (item.id === activityId) {
        return { ...item, day: currentEditDay };
      }
      return item;
    });

    setEditingEvent({
      ...editingEvent,
      schedule: updatedSchedule
    });
  };

  // Add custom activity to the pool of the event being edited
  const handleAddActivityToPool = () => {
    if (!newPoolActivityName.trim() || !editingEvent) return;

    const newActivity = {
      id: `custom-activity-${Date.now()}`,
      type: newPoolActivityType,
      name: newPoolActivityName.trim(),
      day: currentEditDay, // Assign immediately to the current day we are on
      duration: newPoolActivityDuration
    };

    setEditingEvent({
      ...editingEvent,
      schedule: [...editingEvent.schedule, newActivity]
    });

    setNewPoolActivityName('');
  };

  // Delete activity from edited event schedule
  const handleDeleteActivityFromEdit = (activityId) => {
    if (!editingEvent) return;
    setEditingEvent({
      ...editingEvent,
      schedule: editingEvent.schedule.filter(item => item.id !== activityId)
    });
  };

  // Unassign/Unschedule activity (return to pool)
  const handleUnscheduleActivity = (activityId) => {
    if (!editingEvent) return;
    setEditingEvent({
      ...editingEvent,
      schedule: editingEvent.schedule.map(item => {
        if (item.id === activityId) {
          return { ...item, day: null }; // day: null means back in unassigned pool
        }
        return item;
      })
    });
  };

  // Save changes to Firestore
  const handleSaveEdit = async () => {
    if (!editingEvent?.title?.trim() || !editingEvent?.startDate) {
      alert("Please provide at least a Title and Start Date.");
      return;
    }

    try {
      // Calculate team cost based on edit format
      const computedTeamCost = editingEvent.format === 'Australs'
        ? (parseFloat(editingEvent.pricePerDebater) || 0) * 3
        : (parseFloat(editingEvent.pricePerDebater) || 0) * 2;

      const eventDocRef = doc(db, 'tournaments_and_events', editingEvent.id);
      
      const updatedData = {
        ...editingEvent,
        pricePerDebater: parseFloat(editingEvent.pricePerDebater) || 0,
        teamCost: computedTeamCost,
        pricePerJudge: parseFloat(editingEvent.pricePerJudge) || 0,
        noJudgeFeeAmount: editingEvent.noJudgeFeeEnabled ? (parseFloat(editingEvent.noJudgeFeeAmount) || 0) : 0
      };

      // Strip out the ID before saving back to firestore
      delete updatedData.id;

      await updateDoc(eventDocRef, updatedData);
      alert("Event updated successfully!");
      setEditingEvent(null);
      fetchExistingEvents();
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event details.");
    }
  };

  // Delete event entirely
  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tournaments_and_events', eventId));
      alert("Tournament event deleted successfully.");
      if (editingEvent?.id === eventId) {
        setEditingEvent(null);
      }
      fetchExistingEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete the tournament event.");
    }
  };

  const getCusidStyles = (tag) => {
    switch (tag) {
      case 'West': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' };
      case 'East': return { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' };
      case 'Central': return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' };
      case 'National': return { color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)' };
      case 'International': return { color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.4)' };
      default: return { color: '#ffffff', bg: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' };
    }
  };

  const getDaysCount = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    return diff;
  };
  const daysCount = getDaysCount();

  // Initialize dayStartTimes based on daysCount
  useEffect(() => {
    const updated = { ...dayStartTimes };
    let changed = false;
    for (let d = 1; d <= daysCount; d++) {
      if (!updated[d]) {
        updated[d] = '09:00';
        changed = true;
      }
    }
    // Clean up days beyond daysCount
    Object.keys(updated).forEach(k => {
      if (parseInt(k, 10) > daysCount) {
        delete updated[k];
        changed = true;
      }
    });
    if (changed) {
      setDayStartTimes(updated);
    }
  }, [daysCount]);

  // Auto-generate schedule items when rounds count or format changes
  useEffect(() => {
    const defaultDuration = (format === 'BP' || format === 'Australs') ? '1hr 30mins' : '1hr';
    const items = [];

    // Add In-Rounds
    for (let i = 1; i <= inRoundsCount; i++) {
      items.push({
        id: `in-round-${i}`,
        type: 'round',
        name: `Round ${i}`,
        day: i <= Math.ceil(inRoundsCount / 2) ? 1 : Math.min(daysCount, 2), // split rounds across days simply
        duration: defaultDuration
      });
    }

    // Add Out-Rounds (Eliminations)
    const outRoundLabels = ['Grand Finals', 'Semifinals', 'Quarterfinals', 'Octofinals'];
    for (let i = 0; i < outRoundsCount; i++) {
      const idx = outRoundsCount - 1 - i;
      const name = outRoundLabels[idx] || `Out Round ${i + 1}`;
      items.push({
        id: `out-round-${i}`,
        type: 'round',
        name: name,
        day: Math.min(daysCount, 2), // Eliminations usually on final day
        duration: defaultDuration
      });
    }

    setScheduleItems(items);
  }, [inRoundsCount, outRoundsCount, format, daysCount]);

  // Adjust custom activities when levels changes (example for dynamic form fields)
  useEffect(() => {
    const fields = [
      { id: 'firstName', label: 'First Name', type: 'text', required: true },
      { id: 'lastName', label: 'Last Name', type: 'text', required: true },
      { id: 'emailAddress', label: 'Email Address', type: 'text', required: true }
    ];

    if (signupType === 'team') {
      fields.push({ id: 'partnerFirstName', label: 'Partner First Name', type: 'text', required: true });
      fields.push({ id: 'partnerLastName', label: 'Partner Last Name', type: 'text', required: true });
      fields.push({ id: 'partnerEmail', label: 'Partner Email Address', type: 'text', required: true });
    } else if (signupType === 'institution') {
      fields.push({ id: 'institutionName', label: 'Institution Name', type: 'text', required: true });
      fields.push({ id: 'teamSlots', label: 'Number of Team Slots Requested', type: 'number', required: true });
    }

    if (levels.university) {
      fields.push({ id: 'institution', label: 'University / Institution', type: 'text', required: true });
      fields.push({ id: 'cusidId', label: 'CUSID Central ID (Optional)', type: 'text', required: false });
    }

    if (levels.highschool || levels.juniorhigh) {
      // School name is optional for the auto-generated registration form
      fields.push({ id: 'schoolName', label: 'School Name', type: 'text', required: false });
      
      // If both open and novice categories are selected, then Grade / year is necessary
      const bothCats = categories.open && categories.beginner;
      fields.push({ id: 'gradeLevel', label: 'Current Grade / Year', type: 'text', required: bothCats });
    }

    if (requireGuardian) {
      fields.push({ id: 'guardianContact', label: 'Parent / Guardian Contact Info', type: 'text', required: true });
    }
    if (askAllergies) {
      fields.push({ id: 'dietaryAllergies', label: 'Dietary Restrictions & Allergies', type: 'text', required: false });
    }
    if (askExperience) {
      fields.push({ id: 'experienceLevel', label: 'Debate Experience (Number of rounds)', type: 'text', required: false });
    }
    setFormFields(fields);
  }, [levels, categories, signupType, requireGuardian, askAllergies, askExperience]);

  // Drag and Drop reordering logic (native HTML5)
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updated = [...scheduleItems];
    const [removed] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setScheduleItems(updated);
  };

  // Add custom activity
  const addCustomActivity = () => {
    if (!newActivityName.trim()) return;
    const newItem = {
      id: `custom-activity-${Date.now()}`,
      type: 'activity',
      name: newActivityName.trim(),
      day: parseInt(newActivityDay, 10),
      duration: newActivityDuration
    };
    setScheduleItems([...scheduleItems, newItem]);
    setNewActivityName('');
  };

  // Image Upload handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseDurationToMins = (durationStr) => {
    if (!durationStr) return 90;
    const str = String(durationStr).toLowerCase().trim();
    let totalMins = 0;

    const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)/);
    const minMatch = str.match(/(\d+)\s*(?:min|m)/);

    if (hrMatch) {
      totalMins += parseFloat(hrMatch[1]) * 60;
    }
    if (minMatch) {
      totalMins += parseInt(minMatch[1], 10);
    }
    
    if (!hrMatch && !minMatch) {
      const num = parseInt(str, 10);
      if (!isNaN(num)) {
        if (num <= 10) totalMins += num * 60;
        else totalMins += num;
      }
    }
    return totalMins || 90;
  };

  const validateSchedule = () => {
    for (let d = 1; d <= daysCount; d++) {
      const dayStart = dayStartTimes[d] || '09:00';
      const [startHr, startMin] = dayStart.split(':').map(Number);
      
      const dayItems = scheduleItems.filter(item => item.day === d);
      let totalDurationMins = 0;
      dayItems.forEach(item => {
        totalDurationMins += parseDurationToMins(item.duration);
      });

      const totalHours = totalDurationMins / 60;
      if (totalHours > 15) {
        alert(`Day ${d} schedule duration is too long! The activities take ${totalHours.toFixed(1)} hours (which is more than 15 hours). This is not possible for a realistic day schedule starting at ${dayStart}.`);
        return false;
      }

      const startMinsFromMidnight = startHr * 60 + startMin;
      const endMinsFromMidnight = startMinsFromMidnight + totalDurationMins;
      if (endMinsFromMidnight > 24 * 60) {
        alert(`Day ${d} schedule extends past midnight! Starts at ${dayStart} and takes ${totalHours.toFixed(1)} hours. Please shorten your schedule or adjust the start time.`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (activeSection === 1) {
      if (!title.trim()) {
        alert("Please enter a tournament name.");
        return;
      }
      if (!startDate || !endDate) {
        alert("Please select start and end dates.");
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        alert("End date cannot be earlier than start date.");
        return;
      }
      if (modality === 'online' && !onlineLink.trim()) {
        alert("Please provide the Discord server invite or online link.");
        return;
      }
      if (modality === 'in-person' && !venueLocation.trim()) {
        alert("Please provide the location venue details.");
        return;
      }
    }

    if (activeSection === 2) {
      if (!validateSchedule()) {
        return;
      }
    }

    if (activeSection === 3) {
      const hasLevel = levels.university || levels.highschool || levels.juniorhigh;
      if (!hasLevel) {
        alert("Please select at least one academic eligibility level.");
        return;
      }
      const hasCategory = categories.open || categories.beginner;
      if (!hasCategory) {
        alert("Please select at least one skill division category.");
        return;
      }
    }

    setActiveSection(prev => Math.min(7, prev + 1));
  };

  // Save Event and Sync with Calendar
  const handleSaveEvent = async () => {
    if (!title.trim() || !startDate) {
      alert("Please provide at least a Title and Start Date.");
      return;
    }

    if (!validateSchedule()) {
      return;
    }

    const actualEndDate = endDate || startDate;
    const isMultiDay = startDate !== actualEndDate;

    const levelsStr = Object.keys(levels).filter(k => levels[k]).join(', ');
    const catsStr = Object.keys(categories).filter(k => categories[k]).join(', ');
    
    let summaryDesc = `Tournament Format: ${format} (${modality}). `;
    if (levelsStr) summaryDesc += `Eligibility: ${levelsStr}. `;
    if (catsStr) summaryDesc += `Divisions: ${catsStr}. `;
    if (cusidTag) summaryDesc += `CUSID Tag: ${cusidTag} Title. `;
    if (hostedByUCalgary) {
      summaryDesc += `Hosted by University of Calgary.`;
    } else if (hostingUniversity) {
      summaryDesc += `Hosted by ${hostingUniversity}.`;
    }

    try {
      // Calculate team cost: Australs format is 3x debater price, others are 2x
      const computedTeamCost = format === 'Australs' 
        ? (parseFloat(pricePerDebater) || 0) * 3 
        : (parseFloat(pricePerDebater) || 0) * 2;

      // 1. Save to tournaments_and_events
      const eventData = {
        title: title.trim(),
        startDate,
        endDate: actualEndDate,
        format,
        modality,
        onlineLink: modality === 'online' ? onlineLink.trim() : '',
        venueLocation: modality === 'in-person' ? venueLocation.trim() : '',
        hostedByUCalgary,
        timezone,
        inRoundsCount,
        outRoundsCount,
        schedule: scheduleItems,
        dayStartTimes,
        levels: Object.keys(levels).filter(k => levels[k]),
        categories: Object.keys(categories).filter(k => categories[k]),
        cusidTag,
        scope,
        hostingUniversity,
        country: scope === 'international' ? country : 'Canada',
        images,
        logo,
        signupType,
        formFields,
        // Fee Settings
        paymentMethods: Object.keys(paymentMethods).filter(k => paymentMethods[k]),
        pricePerDebater: parseFloat(pricePerDebater) || 0,
        teamCost: computedTeamCost,
        pricePerJudge: parseFloat(pricePerJudge) || 0,
        noJudgeFeeEnabled,
        noJudgeFeeAmount: noJudgeFeeEnabled ? (parseFloat(noJudgeFeeAmount) || 0) : 0
      };

      const docRef = await addDoc(collection(db, 'tournaments_and_events'), eventData);

      // 2. Seamlessly sync into calendar_events
      await addDoc(collection(db, 'calendar_events'), {
        title: title.trim(),
        startDate,
        endDate: actualEndDate,
        isMultiDay,
        startTime: dayStartTimes[1] || '09:00',
        endTime: '17:00',
        category: 'tournament',
        location: modality === 'online' ? (onlineLink.trim() || 'Online / Discord') : (venueLocation.trim() || hostingUniversity),
        description: summaryDesc,
        link: `#/events/tournaments?id=${docRef.id}`,
        timezone
      });

      alert("Tournament created successfully & synced to Calendar!");
      navigate('/executive');
    } catch (err) {
      console.error("Error creating tournament event:", err);
      alert("Failed to save tournament event to Firestore.");
    }
  };

  return (
    <main className="executive-page" style={{ padding: '3rem 1.5rem', minHeight: '100vh', background: '#0b1a3a', color: '#ffffff' }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 2 }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/executive" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Executive Portal
          </Link>
        </div>

        {/* Section Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Create Tournament Event</h1>
          <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>Design and schedule upcoming tournaments. Sync automatically with the central calendar.</p>
        </div>

        {/* Progressive progress tabs */}
        <div
          ref={tabsContainerRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            marginBottom: '2rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {[
            { step: 1, label: '1. Basic Info & Format' },
            { step: 2, label: '2. Schedule Builder' },
            { step: 3, label: '3. Eligibility' },
            { step: 4, label: '4. CUSID & Host' },
            { step: 5, label: '5. Fees & Payment' },
            { step: 6, label: '6. Visuals & Logo' },
            { step: 7, label: '7. Generated Form' }
          ].map(t => {
            const isAccessible = t.step <= maxVisited;
            return (
              <button
                key={t.step}
                onClick={() => isAccessible && setActiveSection(t.step)}
                disabled={!isAccessible}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: activeSection === t.step ? '#2563eb' : 'rgba(255,255,255,0.05)',
                  color: activeSection === t.step ? '#ffffff' : (isAccessible ? '#94a3b8' : '#4b5563'),
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  opacity: isAccessible ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form Content Cards */}
        <div className="glass-card" style={{ background: 'rgba(17, 40, 84, 0.45)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1.25rem', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          
          {/* STEP 1: Dates & Format */}
          {activeSection === 1 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>1. Basic Details & Formats</h2>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tournament Name</label>
                <input
                  type="text"
                  placeholder="e.g. Calgary Summer Cup 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Tournament Debate Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {['BP', 'CP', 'CNDF', 'Australs'].map(fmt => (
                    <div
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      style={{
                        cursor: 'pointer',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        background: format === fmt ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: format === fmt ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        color: format === fmt ? '#60a5fa' : '#cbd5e1',
                        transition: 'all 0.2s',
                        boxShadow: format === fmt ? '0 0 12px rgba(96,165,250,0.4)' : 'none'
                      }}
                    >
                      {fmt}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Location Modality</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {['online', 'in-person'].map(mod => (
                      <div
                        key={mod}
                        onClick={() => setModality(mod)}
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          textAlign: 'center',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          background: modality === mod ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: modality === mod ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                          color: modality === mod ? '#60a5fa' : '#cbd5e1',
                          transition: 'all 0.2s',
                          boxShadow: modality === mod ? '0 0 12px rgba(96,165,250,0.4)' : 'none'
                        }}
                      >
                        {mod}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Host Affiliation</label>
                  <div
                    onClick={() => setHostedByUCalgary(!hostedByUCalgary)}
                    style={{
                      cursor: 'pointer',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      fontWeight: 700,
                      background: hostedByUCalgary ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: hostedByUCalgary ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: hostedByUCalgary ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.2s',
                      boxShadow: hostedByUCalgary ? '0 0 12px rgba(96,165,250,0.4)' : 'none'
                    }}
                  >
                    🏫 Hosted by UCalgary
                  </div>
                </div>
              </div>

              {modality === 'online' && (
                <div className="form-group animate-fade-in" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Online Link / Discord Server Invite</label>
                  <input
                    type="text"
                    placeholder="e.g. https://discord.gg/..."
                    value={onlineLink}
                    onChange={e => setOnlineLink(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              )}

              {modality === 'in-person' && (
                <div className="form-group animate-fade-in" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>In-Person Venue / Room Details</label>
                  <input
                    type="text"
                    placeholder="e.g. University of Calgary, CHE 110"
                    value={venueLocation}
                    onChange={e => setVenueLocation(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              )}

            </div>
          )}

          {/* STEP 2: Timezone & Schedule */}
          {activeSection === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>2. Timezone & Round Settings</h2>
              
              {/* Daily Start Times */}
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: '#60a5fa' }}>Set Daily Start Times</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                    <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Day {d} Start Time</label>
                      <input
                        type="time"
                        value={dayStartTimes[d] || '09:00'}
                        onChange={e => {
                          setDayStartTimes({ ...dayStartTimes, [d]: e.target.value });
                        }}
                        style={{ padding: '0.5rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Timezone</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                  >
                    <option value="MST">MST (Calgary)</option>
                    <option value="EST">EST (Toronto/NY)</option>
                    <option value="PST">PST (Vancouver/LA)</option>
                    <option value="GMT">GMT (London)</option>
                    <option value="AEST">AEST (Sydney)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>In-Rounds count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={inRoundsCount}
                    onChange={e => setInRoundsCount(parseInt(e.target.value, 10) || 5)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Out-Rounds count</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={outRoundsCount}
                    onChange={e => setOutRoundsCount(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Add Custom Activity */}
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: '#60a5fa' }}>Add Non-Round Activity</h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="e.g. Adjudicator Briefing / Lunch Break"
                    value={newActivityName}
                    onChange={e => setNewActivityName(e.target.value)}
                    style={{ flex: 2, minWidth: '200px', padding: '0.65rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                  <select
                    value={newActivityDay}
                    onChange={e => setNewActivityDay(parseInt(e.target.value, 10))}
                    style={{ flex: 1, minWidth: '90px', padding: '0.65rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                  >
                    {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Duration (e.g. 1hr)"
                    value={newActivityDuration}
                    onChange={e => setNewActivityDuration(e.target.value)}
                    style={{ flex: 1, minWidth: '100px', padding: '0.65rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                  <button
                    onClick={addCustomActivity}
                    style={{ padding: '0.65rem 1.25rem', background: '#3b82f6', border: 'none', color: '#ffffff', borderRadius: '0.35rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Draggable Days List */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Drag & Drop Schedule Reordering</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Drag round titles up or down to customize the daily schedule sequence. Assign day slot via dropdown.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scheduleItems.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      background: item.type === 'round' ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#4b5563', cursor: 'grab' }}>☰</span>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.7rem',
                        borderRadius: '0.25rem',
                        background: item.type === 'round' ? '#2563eb' : '#4b5563',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {item.type}
                      </span>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <select
                        value={item.day}
                        onChange={e => {
                          const updated = [...scheduleItems];
                          updated[idx].day = parseInt(e.target.value, 10);
                          setScheduleItems(updated);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(0,0,0,0.3)',
                          color: '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      >
                        {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      
                      {/* Round Length Input */}
                      <input
                        type="text"
                        value={item.duration}
                        onChange={e => {
                          const updated = [...scheduleItems];
                          updated[idx].duration = e.target.value;
                          setScheduleItems(updated);
                        }}
                        style={{
                          width: '100px',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(0,0,0,0.3)',
                          color: '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />

                      {/* Remove Button */}
                      <button
                        onClick={() => setScheduleItems(scheduleItems.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}
                        title="Delete entry"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility */}
          {activeSection === 3 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>3. Eligibility Levels & Divisions</h2>
              
              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Academic Level Eligibility (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { key: 'university', label: '🎓 University', desc: 'Tertiary/College level debaters' },
                    { key: 'highschool', label: '🎒 High School', desc: 'Grades 9 to 12 students' },
                    { key: 'juniorhigh', label: '✏️ Junior High', desc: 'Grades 6 to 8 students' }
                  ].map(lvl => (
                    <div
                      key={lvl.key}
                      onClick={() => setLevels({ ...levels, [lvl.key]: !levels[lvl.key] })}
                      style={{
                        cursor: 'pointer',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        background: levels[lvl.key] ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: levels[lvl.key] ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        color: levels[lvl.key] ? '#60a5fa' : '#cbd5e1',
                        transition: 'all 0.25s',
                        boxShadow: levels[lvl.key] ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{lvl.label}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{lvl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Skill Category Divisions (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { key: 'open', label: '🏆 Open Division', desc: 'Open category for seasoned debaters' },
                    { key: 'beginner', label: '🌱 Beginner / Novice', desc: 'Introductory level for new debaters' }
                  ].map(cat => (
                    <div
                      key={cat.key}
                      onClick={() => setCategories({ ...categories, [cat.key]: !categories[cat.key] })}
                      style={{
                        cursor: 'pointer',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        background: categories[cat.key] ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: categories[cat.key] ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        color: categories[cat.key] ? '#60a5fa' : '#cbd5e1',
                        transition: 'all 0.25s',
                        boxShadow: categories[cat.key] ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{cat.label}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CUSID & Location Details */}
          {activeSection === 4 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>4. CUSID Classifications & Hosts</h2>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>CUSID Title Designation</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { tag: 'West', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'West Title [Blue]' },
                    { tag: 'East', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'East Title [Red]' },
                    { tag: 'Central', color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Central Title [Green]' },
                    { tag: 'National', color: '#eab308', glow: 'rgba(234,179,8,0.3)', label: 'National Title [Yellow]' },
                    { tag: 'International', color: '#c084fc', glow: 'rgba(192,132,252,0.3)', label: 'International Title [Lavender]' },
                    { tag: 'Intervarsity', color: '#ffffff', glow: 'rgba(255,255,255,0.3)', label: 'Intervarsity [White]' }
                  ].map(t => (
                    <div
                      key={t.tag}
                      onClick={() => setCusidTag(cusidTag === t.tag ? '' : t.tag)}
                      style={{
                        cursor: 'pointer',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        background: cusidTag === t.tag ? `${t.color}25` : 'rgba(255, 255, 255, 0.03)',
                        border: cusidTag === t.tag ? `2px solid ${t.color}` : '2px solid rgba(255, 255, 255, 0.1)',
                        color: cusidTag === t.tag ? t.color : '#cbd5e1',
                        transition: 'all 0.2s',
                        boxShadow: cusidTag === t.tag ? `0 0 14px ${t.glow}` : 'none'
                      }}
                    >
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Scope Designation</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[
                      { key: 'canadian', label: '🇨🇦 Canada (Domestic)' },
                      { key: 'international', label: '🌐 International' }
                    ].map(sc => (
                      <div
                        key={sc.key}
                        onClick={() => setScope(sc.key)}
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          textAlign: 'center',
                          fontWeight: 700,
                          background: scope === sc.key ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: scope === sc.key ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                          color: scope === sc.key ? '#60a5fa' : '#cbd5e1',
                          transition: 'all 0.2s',
                          boxShadow: scope === sc.key ? '0 0 12px rgba(96,165,250,0.4)' : 'none'
                        }}
                      >
                        {sc.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hosting Institution / University</label>
                  <input
                    type="text"
                    value={hostingUniversity}
                    onChange={e => setHostingUniversity(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              </div>

              {scope === 'international' && (
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Host Country</label>
                  <input
                    type="text"
                    value={country}
                    placeholder="e.g. United States, United Kingdom"
                    onChange={e => setCountry(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Fees & Payment */}
          {activeSection === 5 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>5. Fees & Payment Settings</h2>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Accepted Payment Methods (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { key: 'etransfer', label: '💸 E-Transfer', desc: 'Direct bank transfer' },
                    { key: 'stripe', label: '💳 Credit/Debit', desc: 'Online via Stripe' },
                    { key: 'cashcheque', label: '💵 Cash/Cheque', desc: 'Pay at venue / Invoice' },
                    { key: 'paypal', label: '🅿️ PayPal', desc: 'Digital transfer' }
                  ].map(method => (
                    <div
                      key={method.key}
                      onClick={() => setPaymentMethods({ ...paymentMethods, [method.key]: !paymentMethods[method.key] })}
                      style={{
                        cursor: 'pointer',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: paymentMethods[method.key] ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: paymentMethods[method.key] ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        color: paymentMethods[method.key] ? '#60a5fa' : '#cbd5e1',
                        transition: 'all 0.25s',
                        boxShadow: paymentMethods[method.key] ? '0 0 12px rgba(96, 165, 250, 0.3)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{method.label}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{method.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price Per Debater ($ CAD)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricePerDebater}
                    onChange={e => setPricePerDebater(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600 }}>
                    Calculated Team Cost: ${format === 'Australs' ? (pricePerDebater * 3).toFixed(2) : (pricePerDebater * 2).toFixed(2)} CAD
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 400, marginTop: '0.1rem' }}>
                      (Format: {format} — calculated as {format === 'Australs' ? '3x' : '2x'} price per debater)
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price Per Judge ($ CAD)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricePerJudge}
                    onChange={e => setPricePerJudge(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                <div
                  onClick={() => setNoJudgeFeeEnabled(!noJudgeFeeEnabled)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '2px solid #60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: noJudgeFeeEnabled ? '#60a5fa' : 'transparent',
                    boxShadow: noJudgeFeeEnabled ? '0 0 8px #60a5fa' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {noJudgeFeeEnabled && <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600 }}>Charge penalty fee if team does not provide a judge</span>
                </div>

                {noJudgeFeeEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', paddingLeft: '1.85rem' }} className="animate-fade-in">
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Additional Missing Judge Fee ($ CAD)</label>
                    <input
                      type="number"
                      min="0"
                      value={noJudgeFeeAmount}
                      onChange={e => setNoJudgeFeeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ width: '200px', padding: '0.65rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Image Uploads */}
          {activeSection === 6 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>6. Upload Tournament Visuals</h2>
              
              {/* Logo Upload Section */}
              <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#60a5fa' }}>Upload Tournament Logo (Square Banner)</h4>
                <div
                  onClick={() => logoInputRef.current.click()}
                  style={{
                    border: '2px dashed rgba(168,85,247,0.4)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(168,85,247,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'}
                >
                  {logo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={logo} alt="Logo Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px' }} />
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Logo uploaded successfully. Click to replace.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e9d5ff' }}>Select logo file</div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Flyer upload */}
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#60a5fa' }}>Upload Banner Flyers / Photos</h4>
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: '2px dashed rgba(96,165,250,0.4)',
                  borderRadius: '1rem',
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'rgba(96,165,250,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '2rem'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#60a5fa'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🖼️</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload Event Images / Flyers</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select images from your system to display in the event portal background and galleries.</div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              {images.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Uploaded Flyers / Banner Previews</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '110px' }}>
                        <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: '#ef4444',
                            border: 'none',
                            color: '#ffffff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Form Generation Builder */}
          {activeSection === 7 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#60a5fa' }}>7. Registration Form Generator Options</h2>
              
              {/* Registration Mode choice */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Registration Form Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { type: 'individual', label: '👤 Individual', desc: 'Single debater sign-up' },
                    { type: 'team', label: '👥 Team', desc: 'Two-person team sign-up' },
                    { type: 'institution', label: '🏫 Institution', desc: 'Full school delegation sign-up' }
                  ].map(s => (
                    <div
                      key={s.type}
                      onClick={() => setSignupType(s.type)}
                      style={{
                        cursor: 'pointer',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        background: signupType === s.type ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: signupType === s.type ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        color: signupType === s.type ? '#60a5fa' : '#cbd5e1',
                        transition: 'all 0.25s',
                        boxShadow: signupType === s.type ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '2rem' }}>Configure form parameters to automatically generate matching sign-up portals for participants.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                <div
                  onClick={() => setRequireGuardian(!requireGuardian)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: requireGuardian ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: requireGuardian ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                    color: requireGuardian ? '#60a5fa' : '#cbd5e1',
                    transition: 'all 0.25s',
                    boxShadow: requireGuardian ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>👪 Require Guardian Info</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>For under-18 categories and schools.</div>
                </div>

                <div
                  onClick={() => setAskAllergies(!askAllergies)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: askAllergies ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: askAllergies ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                    color: askAllergies ? '#60a5fa' : '#cbd5e1',
                    transition: 'all 0.25s',
                    boxShadow: askAllergies ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>🥗 Food Allergies Field</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Add fields for catering/banquet choices.</div>
                </div>

                <div
                  onClick={() => setAskExperience(!askExperience)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: askExperience ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: askExperience ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                    color: askExperience ? '#60a5fa' : '#cbd5e1',
                    transition: 'all 0.25s',
                    boxShadow: askExperience ? '0 0 15px rgba(96, 165, 250, 0.4)' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>🎙️ Debate Experience Field</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Ask for debate tenure & history.</div>
                </div>
              </div>

              {/* Form Preview Section */}
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Auto-Generated Registration Form Preview ({signupType})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formFields.map(f => (
                    <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                        {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder={`Mock input for ${f.label}`}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'not-allowed' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            onClick={() => setActiveSection(prev => Math.max(1, prev - 1))}
            disabled={activeSection === 1}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeSection === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
              color: activeSection === 1 ? '#4b5563' : '#ffffff',
              fontWeight: 650,
              cursor: activeSection === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Previous Section
          </button>

          {activeSection < 7 ? (
            <button
              onClick={handleNextStep}
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Next Section →
            </button>
          ) : (
            <button
              onClick={handleSaveEvent}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(16,185,129,0.4)',
                transition: 'all 0.2s'
              }}
            >
              Save Tournament Event ✓
            </button>
          )}
        </div>

        {/* ================= EXISTING TOURNAMENTS SECTION ================= */}
        <div style={{ marginTop: '5rem', borderTop: '2px solid rgba(255,255,255,0.08)', paddingTop: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>📋 Existing Tournaments & Events</h2>
            <p style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>Select a tournament to modify its schedule using drag-and-drop or edit its configurations.</p>
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: '#cbd5e1' }}>Loading tournaments...</p>
            </div>
          ) : existingEvents.length === 0 ? (
            <div style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>No existing events found. Create one using the wizard above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              {existingEvents.map(event => {
                const cusid = getCusidStyles(event.cusidTag);
                return (
                  <div 
                    key={event.id} 
                    style={{ 
                      background: 'rgba(17, 40, 84, 0.45)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      borderRadius: '1rem', 
                      padding: '1.75rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '1.5rem' 
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {event.cusidTag && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', background: cusid.bg, color: cusid.color, border: cusid.border }}>
                            {event.cusidTag} Title
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', background: event.modality === 'online' ? '#2563eb' : '#059669', color: '#ffffff' }}>
                          {event.modality}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                          {event.format}
                        </span>
                        {event.levels?.map(lvl => (
                          <span key={lvl} style={{ fontSize: '0.7rem', background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                            {lvl === 'highschool' ? 'High School' : lvl === 'juniorhigh' ? 'Junior High' : lvl}
                          </span>
                        ))}
                      </div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{event.title}</h3>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
                        📅 {event.startDate === event.endDate ? event.startDate : `${event.startDate} to ${event.endDate}`} | Host: {event.hostedByUCalgary ? 'University of Calgary' : event.hostingUniversity}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleStartEdit(event)}
                        style={{ padding: '0.65rem 1.25rem', background: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Edit Details & Schedule
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        style={{ padding: '0.65rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= EVENT EDIT PANEL (DOCKING / CONDITIONAL) ================= */}
        {editingEvent && (
          <div 
            id="event-edit-panel" 
            className="glass-card" 
            style={{ 
              marginTop: '4rem', 
              background: 'rgba(17, 40, 84, 0.55)', 
              backdropFilter: 'blur(16px)', 
              border: '2px solid rgba(96,165,250,0.3)', 
              borderRadius: '1.5rem', 
              padding: '2.5rem', 
              boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>✏️ Edit Event Details: {editingEvent.title}</h2>
              <button 
                onClick={() => setEditingEvent(null)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Editing Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tournament Name</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start Date</label>
                <input
                  type="date"
                  value={editingEvent.startDate}
                  onChange={e => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>End Date</label>
                <input
                  type="date"
                  value={editingEvent.endDate}
                  onChange={e => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Format</label>
                <select
                  value={editingEvent.format}
                  onChange={e => setEditingEvent({ ...editingEvent, format: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                >
                  <option value="BP">BP</option>
                  <option value="CP">CP</option>
                  <option value="CNDF">CNDF</option>
                  <option value="Australs">Australs</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Modality</label>
                <select
                  value={editingEvent.modality}
                  onChange={e => setEditingEvent({ ...editingEvent, modality: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                >
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              {editingEvent.modality === 'online' ? (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Online Server Link</label>
                  <input
                    type="text"
                    value={editingEvent.onlineLink || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, onlineLink: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                  />
                </div>
              ) : (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Venue Location Details</label>
                  <input
                    type="text"
                    value={editingEvent.venueLocation || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, venueLocation: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                  />
                </div>
              )}

              {/* Scope & Host Details */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Scope</label>
                <select
                  value={editingEvent.scope}
                  onChange={e => setEditingEvent({ ...editingEvent, scope: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                >
                  <option value="canadian">Canada (Domestic)</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hosting Institution</label>
                <input
                  type="text"
                  value={editingEvent.hostingUniversity}
                  onChange={e => setEditingEvent({ ...editingEvent, hostingUniversity: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>

              {/* Fee Editing Fields */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price Per Debater ($ CAD)</label>
                <input
                  type="number"
                  min="0"
                  value={editingEvent.pricePerDebater}
                  onChange={e => setEditingEvent({ ...editingEvent, pricePerDebater: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
                <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#60a5fa' }}>
                  Calculated Team Fee: ${editingEvent.format === 'Australs' ? (editingEvent.pricePerDebater * 3).toFixed(2) : (editingEvent.pricePerDebater * 2).toFixed(2)} CAD
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price Per Judge ($ CAD)</label>
                <input
                  type="number"
                  min="0"
                  value={editingEvent.pricePerJudge}
                  onChange={e => setEditingEvent({ ...editingEvent, pricePerJudge: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div
                  onClick={() => setEditingEvent({ ...editingEvent, noJudgeFeeEnabled: !editingEvent.noJudgeFeeEnabled })}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '2px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', background: editingEvent.noJudgeFeeEnabled ? '#60a5fa' : 'transparent' }}>
                    {editingEvent.noJudgeFeeEnabled && <span style={{ color: '#000000', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Incur penalty fee for missing adjudicator</span>
                </div>
                {editingEvent.noJudgeFeeEnabled && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Missing Judge Fee Amount ($ CAD)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingEvent.noJudgeFeeAmount || 0}
                      onChange={e => setEditingEvent({ ...editingEvent, noJudgeFeeAmount: parseFloat(e.target.value) || 0 })}
                      style={{ width: '150px', padding: '0.5rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ================= INTERACTIVE DRAG & DROP SCHEDULE EDITOR ================= */}
            <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#60a5fa', fontWeight: 800, marginBottom: '0.5rem' }}>📅 Day-by-Day Interactive Scheduler</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Use Left / Right navigation to view different tournament days. Drag activities from the pool and drop them into the Day Box to assign them.
              </p>

              {/* Day Selector Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentEditDay(prev => Math.max(1, prev - 1))}
                  disabled={currentEditDay === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: currentEditDay === 1 ? 'rgba(255,255,255,0.02)' : '#2563eb',
                    color: currentEditDay === 1 ? '#4b5563' : '#ffffff',
                    border: 'none',
                    borderRadius: '0.35rem',
                    cursor: currentEditDay === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  ◀ Previous Day
                </button>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Day <span style={{ color: '#60a5fa', fontSize: '1.5rem' }}>{currentEditDay}</span> of {getEditDaysCount()}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentEditDay(prev => Math.min(getEditDaysCount(), prev + 1))}
                  disabled={currentEditDay === getEditDaysCount()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: currentEditDay === getEditDaysCount() ? 'rgba(255,255,255,0.02)' : '#2563eb',
                    color: currentEditDay === getEditDaysCount() ? '#4b5563' : '#ffffff',
                    border: 'none',
                    borderRadius: '0.35rem',
                    cursor: currentEditDay === getEditDaysCount() ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  Next Day ▶
                </button>
              </div>

              {/* Dynamic Day Details Input (e.g. Day Start Time) */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>⏰ Start time for Day {currentEditDay}:</span>
                <input
                  type="time"
                  value={editingEvent.dayStartTimes?.[currentEditDay] || '09:00'}
                  onChange={e => {
                    const times = { ...(editingEvent.dayStartTimes || {}) };
                    times[currentEditDay] = e.target.value;
                    setEditingEvent({ ...editingEvent, dayStartTimes: times });
                  }}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#ffffff' }}
                />
              </div>

              {/* drag & drop vertical stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. Activities Pool container (Draggables) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#60a5fa' }}>💡 Activities Pool (Draggable Items)</h4>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Drag any round or activity into the Day Box drop zone below.</span>
                  </div>

                  {/* List of items in pool */}
                  <div 
                    style={{ 
                      padding: '1.25rem', 
                      background: 'rgba(0,0,0,0.2)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '1rem', 
                      minHeight: '220px',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {editingEvent.schedule && editingEvent.schedule.length > 0 ? (
                      editingEvent.schedule.map(activity => (
                        <div
                          key={activity.id}
                          draggable
                          onDragStart={e => handleDragStartEdit(e, activity.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: activity.day === currentEditDay ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
                            border: activity.day === currentEditDay ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '0.5rem',
                            cursor: 'grab'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', cursor: 'grab' }}>☰</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '3px', background: activity.type === 'round' ? '#2563eb' : '#4b5563', color: '#ffffff', fontWeight: 800, textTransform: 'uppercase' }}>
                              {activity.type}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activity.name}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{activity.duration}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px', background: activity.day ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: activity.day ? '#10b981' : '#f87171' }}>
                              {activity.day ? `Day ${activity.day}` : 'Unassigned'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivityFromEdit(activity.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}
                              title="Delete from schedule"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#cbd5e1', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No activities in the pool. Add some below!</p>
                    )}
                  </div>

                  {/* Add Pool Activity Form */}
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#cbd5e1' }}>Add New Activity to Pool</h5>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Activity name (e.g. Round 4)"
                        value={newPoolActivityName}
                        onChange={e => setNewPoolActivityName(e.target.value)}
                        style={{ flex: 2, minWidth: '150px', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                      />
                      <input
                        type="text"
                        placeholder="e.g. 1hr 30m"
                        value={newPoolActivityDuration}
                        onChange={e => setNewPoolActivityDuration(e.target.value)}
                        style={{ flex: 1, minWidth: '80px', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#ffffff' }}
                      />
                      <select
                        value={newPoolActivityType}
                        onChange={e => setNewPoolActivityType(e.target.value)}
                        style={{ flex: 1, minWidth: '90px', padding: '0.5rem', fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                      >
                        <option value="round">Round</option>
                        <option value="activity">Activity</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddActivityToPool}
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '0.35rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Day drop zone box */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>📥 Day {currentEditDay} Box Drop Zone</h4>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Drop items here from the activities list to assign them to Day {currentEditDay}.</span>
                  </div>

                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropToDayBox}
                    style={{
                      border: '2px dashed rgba(16,185,129,0.4)',
                      background: 'rgba(16,185,129,0.02)',
                      borderRadius: '1rem',
                      minHeight: '340px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'all 0.2s',
                      overflowY: 'auto'
                    }}
                    onDragEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                    onDragLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'}
                  >
                    {editingEvent.schedule && editingEvent.schedule.filter(item => item.day === currentEditDay).length > 0 ? (
                      editingEvent.schedule.filter(item => item.day === currentEditDay).map((activity, idx) => (
                        <div
                          key={activity.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1.25rem',
                            borderRadius: '0.5rem',
                            background: activity.type === 'round' ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '3px', background: activity.type === 'round' ? '#2563eb' : '#4b5563', color: '#ffffff', fontWeight: 800, textTransform: 'uppercase' }}>
                              {activity.type}
                            </span>
                            <span style={{ fontWeight: 600, color: '#ffffff' }}>{activity.name}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>⏱️ {activity.duration}</span>
                            <button
                              type="button"
                              onClick={() => handleUnscheduleActivity(activity.id)}
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                              title="Remove from Day"
                            >
                              Unschedule
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', margin: 'auto', color: '#cbd5e1' }}>
                        <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>📥</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Drop zone is empty</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Drag a round/activity from the pool list and drop it here.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Actions buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                style={{ padding: '0.85rem 1.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#ffffff', fontWeight: 650, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel Edits
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ padding: '0.85rem 2rem', borderRadius: '0.5rem', border: 'none', background: '#10b981', color: '#ffffff', fontWeight: 750, cursor: 'pointer', boxShadow: '0 0 15px rgba(16,185,129,0.4)', transition: 'all 0.2s' }}
              >
                Save Event Changes ✓
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Under Development Popup Overlay */}
      {showUnderDev && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 10, 25, 0.82)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '2rem'
        }}>
          <style>{`
            @keyframes devPopFade {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes devPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.08); }
              100% { transform: scale(1); }
            }
          `}</style>
          <div className="glass-card" style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(17, 40, 84, 0.85)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            animation: 'devPopFade 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem', display: 'inline-block', animation: 'devPulse 2s infinite ease-in-out' }}>
              🚧
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>🏗️ Under Development 🏗️</span>
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
              This page is currently under development. UCDS organizers are building new interactive tournament systems.
            </p>
            <button
              onClick={() => setShowUnderDev(false)}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                color: '#000000',
                padding: '0.85rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 750,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)'; }}
            >
              Understand 🛠️
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
