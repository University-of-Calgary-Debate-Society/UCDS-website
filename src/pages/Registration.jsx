import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useDialog } from '../context/DialogContext';

const STORAGE_KEY = "CalgarySummerCup2026_RegistrationDraft";

const gradeMap = {
  "Grade 6": 6,
  "Grade 7": 7,
  "Grade 8": 8,
  "Grade 9": 9,
  "Grade 10": 10,
  "Grade 11": 11,
  "Grade 12": 12
};

export default function Registration() {
  const navigate = useNavigate();
  const { alert } = useDialog();
  const saveTimeoutRef = useRef(null);
  
  // Form State
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    grade: '',
    partnerName: '',
    partnerEmail: '',
    partnerGrade: '',
    category: '',
    suggestions: '',
    subscribeDebate: true // Default to true
  });

  const [draftStatus, setDraftStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logicWarning, setLogicWarning] = useState('');

  // Category availability states based on grade logic
  const [allowedCategories, setAllowedCategories] = useState({
    junior_beginner: true,
    junior_open: true,
    senior_beginner: true,
    senior_open: true
  });

  // Restore draft on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        setFormState(prev => ({
          ...prev,
          ...draft
        }));
        setDraftStatus('Draft restored.');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setDraftStatus(''), 2000);
      } catch (e) {
        console.error('Failed to parse registration draft', e);
      }
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Recalculate allowed categories and validate logic whenever grades change
  useEffect(() => {
    const { grade, partnerGrade } = formState;
    setLogicWarning('');

    const categories = {
      junior_beginner: true,
      junior_open: true,
      senior_beginner: true,
      senior_open: true
    };

    if (!grade || !partnerGrade) {
      setAllowedCategories(categories);
      return;
    }

    const subNum = gradeMap[grade];
    const partNum = gradeMap[partnerGrade];
    const maxGrade = Math.max(subNum, partNum);

    if (maxGrade === 12) {
      categories.junior_beginner = false;
      categories.junior_open = false;
      categories.senior_beginner = false;
      categories.senior_open = false;
      categories.senior_open = true; // Only Senior Open allowed
    } else if (maxGrade === 10 || maxGrade === 11) {
      categories.junior_beginner = false;
      categories.junior_open = false;
    } else if (maxGrade === 9) {
      categories.junior_beginner = false;
    } else {
      // maxGrade <= 8
      categories.senior_beginner = false;
      categories.senior_open = false;
    }

    setAllowedCategories(categories);

    // If selected category is now disabled, reset it
    if (formState.category) {
      const isSelectedAllowed = 
        (formState.category === 'Junior Beginner' && categories.junior_beginner) ||
        (formState.category === 'Junior Open' && categories.junior_open) ||
        (formState.category === 'Senior Beginner' && categories.senior_beginner) ||
        (formState.category === 'Senior Open' && categories.senior_open);
      
      if (!isSelectedAllowed) {
        setFormState(prev => ({ ...prev, category: '' }));
      }
    }

    // Check if no categories are active
    const activeCount = Object.values(categories).filter(Boolean).length;
    if (activeCount === 0) {
      setLogicWarning('No eligible competitive categories are available for this grade combination.');
    }
  }, [formState.grade, formState.partnerGrade, formState.category]);

  const showSaveStatus = (msg = 'Draft saved.') => {
    setDraftStatus(msg);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setDraftStatus('');
    }, 1500);
  };

  // Handle inputs and trigger auto-save
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    const nextState = {
      ...formState,
      [name]: val
    };

    setFormState(nextState);
    
    // Save draft to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    showSaveStatus();
  };

  const handleCategoryChange = (val) => {
    const nextState = {
      ...formState,
      category: val
    };
    setFormState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    showSaveStatus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!emailRegex.test(formState.partnerEmail.trim())) {
      alert("Please enter a valid partner email address.");
      return;
    }
    if (!formState.category) {
      alert("Please select a tournament category.");
      return;
    }

    setIsSubmitting(true);
    setDraftStatus('Submitting registration...');

    try {
      // 1. Submit Registration payload to Firestore
      await addDoc(collection(db, 'registrations'), {
        timestamp: new Date().toISOString(),
        fullName: formState.fullName.trim(),
        email: formState.email.trim(),
        grade: formState.grade,
        partnerName: formState.partnerName.trim(),
        partnerEmail: formState.partnerEmail.trim(),
        partnerGrade: formState.partnerGrade,
        category: formState.category,
        suggestions: formState.suggestions.trim(),
        subscribedToMailingList: formState.subscribeDebate
      });

      // 2. Add to Subscribers collection if they opted-in
      if (formState.subscribeDebate) {
        const getInitialListType = (gradeStr) => {
          const match = (gradeStr || '').match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num <= 9) return 'junior_high_students';
            return 'high_school_students';
          }
          return 'subscribers';
        };

        const splitName = (nameStr) => {
          const trimmed = (nameStr || '').trim();
          const parts = trimmed.split(/\s+/);
          const first = parts[0] || '';
          const last = parts.slice(1).join(' ') || '';
          return { first, last };
        };

        const isNovice = formState.category.toLowerCase().includes('beginner');
        const timestamp = new Date().toISOString();

        // Register registrant
        try {
          const userNames = splitName(formState.fullName);
          const userListType = getInitialListType(formState.grade);
          await addDoc(collection(db, 'subscribers'), {
            email: formState.email.trim().toLowerCase(),
            fullName: formState.fullName.trim(),
            firstName: userNames.first,
            lastName: userNames.last,
            grade: formState.grade,
            listType: userListType,
            lists: [userListType],
            subscribed: true,
            active: true,
            createdAt: timestamp,
            updatedAt: timestamp,
            debater: true,
            novice: isNovice,
            volunteer: false,
            judge: false
          });
        } catch (subErr) {
          console.error("Failed to register registrant subscriber", subErr);
        }

        // Register partner
        try {
          const partnerNames = splitName(formState.partnerName);
          const partnerListType = getInitialListType(formState.partnerGrade);
          await addDoc(collection(db, 'subscribers'), {
            email: formState.partnerEmail.trim().toLowerCase(),
            fullName: formState.partnerName.trim(),
            firstName: partnerNames.first,
            lastName: partnerNames.last,
            grade: formState.partnerGrade,
            listType: partnerListType,
            lists: [partnerListType],
            subscribed: true,
            active: true,
            createdAt: timestamp,
            updatedAt: timestamp,
            debater: true,
            novice: isNovice,
            volunteer: false,
            judge: false
          });
        } catch (subErr) {
          console.error("Failed to register partner subscriber", subErr);
        }
      }

      // Success
      localStorage.removeItem(STORAGE_KEY);
      navigate('/events/calgary-summer-cup/registration/success');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setDraftStatus('Error - Try Again');
      alert("There was a problem submitting your registration. Please verify your connection or try again.");
    }
  };

  return (
    <main>
      <section className="section animate-on-scroll fade-in" style={{ position: 'relative', minHeight: '90vh' }}>
        {/* Background Floating SVGs */}
        <div className="bg-art-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {/* Gavel */}
          <svg className="reg-bg-icon reg-icon-gavel" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5.5 5.5t-9-1.5M9.5 8.5l9 9M17 11l4.5-4.5M10.5 4.5 15 9"/><path d="m6 21 3-3"/></svg>
          {/* Speech Bubble */}
          <svg className="reg-bg-icon reg-icon-speech" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {/* Podium */}
          <svg className="reg-bg-icon reg-icon-podium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16M6 22V10h12v12M12 6V2M8 4h8"/></svg>
          {/* Book */}
          <svg className="reg-bg-icon reg-icon-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          {/* Scales of Justice */}
          <svg className="reg-bg-icon reg-icon-scales" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>
          {/* Trophy */}
          <svg className="reg-bg-icon reg-icon-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5c0 2.5-2 4.5-4.5 4.5h-3C7.99 16 6 14 6 11.5V8a6 6 0 0 1 6-6Z"/></svg>
          {/* Microphone */}
          <svg className="reg-bg-icon reg-icon-microphone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8"/></svg>
          {/* Graduation Cap */}
          <svg className="reg-bg-icon reg-icon-cap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <Link className="back-btn" to="/events/calgary-summer-cup" style={{ textDecoration: 'none', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '18px', height: '18px', display: 'inline' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to Tournament Overview
            </Link>
          </div>
          
          <div className="registration-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 className="title-box" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}><span>Tournament Registration</span></h1>
              <p className="subtitle" style={{ color: '#94a3b8', margin: 0 }}>
                Calgary Summer Cup 2026. Fill out the details below. Drafts are saved automatically.
              </p>
            </div>
            
            <div style={{ minHeight: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                opacity: draftStatus ? 1 : 0,
                transform: draftStatus ? 'translateY(0)' : 'translateY(-5px)',
                pointerEvents: 'none',
                textAlign: 'center',
                color: '#93c5fd'
              }}>
                ℹ️ {draftStatus || 'Draft saved.'}
              </div>
            </div>
            
            <form id="registrationForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Participant details */}
              <div className="form-section-card">
                <h3>Your Information</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="fullName" style={{ fontWeight: 600 }}>Full Name</label>
                    <input 
                      type="text" 
                      id="fullName" 
                      name="fullName" 
                      value={formState.fullName} 
                      onChange={handleInputChange} 
                      className="text-input" 
                      placeholder="John Doe" 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email" style={{ fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formState.email} 
                      onChange={handleInputChange} 
                      className="text-input" 
                      placeholder="johndoe@example.com" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <label htmlFor="grade" style={{ fontWeight: 600 }}>Grade (2025-2026 Academic Year)</label>
                  <select 
                    id="grade" 
                    name="grade" 
                    value={formState.grade} 
                    onChange={handleInputChange} 
                    className="select-input" 
                    required
                  >
                    <option value="" disabled>Select your grade</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              {/* Partner Details */}
              <div className="form-section-card">
                <h3>Partner Information</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="partnerName" style={{ fontWeight: 600 }}>Partner's Full Name</label>
                    <input 
                      type="text" 
                      id="partnerName" 
                      name="partnerName" 
                      value={formState.partnerName} 
                      onChange={handleInputChange} 
                      className="text-input" 
                      placeholder="Jane Smith" 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="partnerEmail" style={{ fontWeight: 600 }}>Partner's Email Address</label>
                    <input 
                      type="email" 
                      id="partnerEmail" 
                      name="partnerEmail" 
                      value={formState.partnerEmail} 
                      onChange={handleInputChange} 
                      className="text-input" 
                      placeholder="janesmith@example.com" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <label htmlFor="partnerGrade" style={{ fontWeight: 600 }}>Partner's Grade (2025-2026 Academic Year)</label>
                  <select 
                    id="partnerGrade" 
                    name="partnerGrade" 
                    value={formState.partnerGrade} 
                    onChange={handleInputChange} 
                    className="select-input" 
                    required
                  >
                    <option value="" disabled>Select partner's grade</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              {/* Tournament Category */}
              <div className="form-section-card">
                <h3>Tournament Category</h3>
                
                <div style={{
                  transition: 'all 0.3s ease',
                  height: logicWarning ? 'auto' : '0px',
                  opacity: logicWarning ? 1 : 0,
                  overflow: 'hidden',
                  marginBottom: logicWarning ? '1.5rem' : '0px'
                }}>
                  <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                    ⚠️ {logicWarning}
                  </div>
                </div>

                <div className="category-radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label className={`radio-label ${!allowedCategories.junior_beginner ? 'disabled' : ''} ${formState.category === 'Junior Beginner' ? 'checked' : ''}`}>
                    <input 
                      type="radio" 
                      name="category" 
                      value="Junior Beginner"
                      checked={formState.category === 'Junior Beginner'}
                      disabled={!allowedCategories.junior_beginner}
                      onChange={() => handleCategoryChange('Junior Beginner')}
                    />
                    <div>
                      <strong>Junior Beginner</strong> (Grades 6-8, first-time competitors)
                    </div>
                  </label>

                  <label className={`radio-label ${!allowedCategories.junior_open ? 'disabled' : ''} ${formState.category === 'Junior Open' ? 'checked' : ''}`}>
                    <input 
                      type="radio" 
                      name="category" 
                      value="Junior Open"
                      checked={formState.category === 'Junior Open'}
                      disabled={!allowedCategories.junior_open}
                      onChange={() => handleCategoryChange('Junior Open')}
                    />
                    <div>
                      <strong>Junior Open</strong> (Grades 6-8, experienced competitors)
                    </div>
                  </label>

                  <label className={`radio-label ${!allowedCategories.senior_beginner ? 'disabled' : ''} ${formState.category === 'Senior Beginner' ? 'checked' : ''}`}>
                    <input 
                      type="radio" 
                      name="category" 
                      value="Senior Beginner"
                      checked={formState.category === 'Senior Beginner'}
                      disabled={!allowedCategories.senior_beginner}
                      onChange={() => handleCategoryChange('Senior Beginner')}
                    />
                    <div>
                      <strong>Senior Beginner</strong> (Grades 9-11, first-time competitors)
                    </div>
                  </label>

                  <label className={`radio-label ${!allowedCategories.senior_open ? 'disabled' : ''} ${formState.category === 'Senior Open' ? 'checked' : ''}`}>
                    <input 
                      type="radio" 
                      name="category" 
                      value="Senior Open"
                      checked={formState.category === 'Senior Open'}
                      disabled={!allowedCategories.senior_open}
                      onChange={() => handleCategoryChange('Senior Open')}
                    />
                    <div>
                      <strong>Senior Open</strong> (Grades 9-12, open category)
                    </div>
                  </label>
                </div>
              </div>

              {/* Suggestions / Newsletter */}
              <div className="form-section-card">
                <h3>Additional Options</h3>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="suggestions" style={{ fontWeight: 600 }}>Questions or Food/Equity Suggestions</label>
                  <textarea 
                    id="suggestions" 
                    name="suggestions" 
                    value={formState.suggestions} 
                    onChange={handleInputChange} 
                    className="textarea-input" 
                    placeholder="Dietary restrictions, equity concerns, or general inquiries..."
                    rows="3"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    id="subscribeDebate" 
                    name="subscribeDebate" 
                    checked={formState.subscribeDebate} 
                    onChange={handleInputChange} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="subscribeDebate" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                    Subscribe to the UCDS Mailing List to receive news and future tournament announcements.
                  </label>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  className="button form-submit-btn" 
                  disabled={isSubmitting || !!logicWarning}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
