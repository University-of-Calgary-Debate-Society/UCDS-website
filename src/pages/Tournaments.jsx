import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useDialog } from '../context/DialogContext';
import VectorFlow from '../components/VectorFlow';

export default function Tournaments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { alert } = useDialog();

  const [tournaments, setTournaments] = useState([]);
  const [showUnderDev, setShowUnderDev] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form states
  const [formData, setFormData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [registrantGrade, setRegistrantGrade] = useState('');
  const [partnerGrade, setPartnerGrade] = useState('');
  const [registrantIsNovice, setRegistrantIsNovice] = useState(false);
  const [partnerIsNovice, setPartnerIsNovice] = useState(false);
  const [subscribeToMailing, setSubscribeToMailing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Parse ID from location query or hash safely
  const getTournamentId = () => {
    const searchParams = new URLSearchParams(location.search);
    let id = searchParams.get('id');
    if (id) return id;

    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryPart = hash.split('?')[1];
      const hashParams = new URLSearchParams(queryPart);
      id = hashParams.get('id');
    }
    return id;
  };

  const tournamentId = getTournamentId();

  // Fetch tournaments
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const snapshot = await getDocs(collection(db, 'tournaments_and_events'));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter out past events
        const upcoming = list.filter(t => {
          const end = t.endDate || t.startDate;
          return (end || '') >= todayStr;
        });

        // Sort by start date ascending
        upcoming.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
        setTournaments(upcoming);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch individual tournament detail if ID is specified
  useEffect(() => {
    if (!tournamentId) {
      setSelectedTournament(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const docRef = doc(db, 'tournaments_and_events', tournamentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tData = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : null;
          setSelectedTournament(tData);
          
          // Reset form fields
          const initialForm = {};
          if (tData && tData.formFields) {
            tData.formFields.forEach(f => {
              initialForm[f.id] = '';
            });
          }
          setFormData(initialForm);
          setSelectedCategory('');
          setRegistrantGrade('');
          setPartnerGrade('');
          setRegistrantIsNovice(false);
          setPartnerIsNovice(false);
          setSubscribeToMailing(true);
        } else {
          alert("Tournament not found or has been deleted.");
          navigate('/events/tournaments');
        }
      } catch (err) {
        console.error("Error loading tournament details:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [tournamentId, navigate, alert]);

  // Grade level mappings for Calgary Summer Cup rules
  const gradeMap = {
    "Grade 6": 6,
    "Grade 7": 7,
    "Grade 8": 8,
    "Grade 9": 9,
    "Grade 10": 10,
    "Grade 11": 11,
    "Grade 12": 12
  };

  // Calgary Summer Cup logic check
  const isCalgarySummerCupStyle = () => {
    if (!selectedTournament) return false;
    const { levels, categories } = selectedTournament;
    const isSchoolOnly = (levels?.includes('highschool') || levels?.includes('juniorhigh')) && !levels?.includes('university');
    const hasBothCats = categories?.includes('open') && categories?.includes('beginner');
    return isSchoolOnly && hasBothCats;
  };

  // Get allowed categories based on Calgary Summer Cup rules
  const getAllowedSchoolCategories = () => {
    const defaultCats = {
      junior_beginner: true,
      junior_open: true,
      senior_beginner: true,
      senior_open: true
    };

    if (!registrantGrade) return defaultCats;

    const regNum = gradeMap[registrantGrade] || 0;
    const partNum = selectedTournament?.signupType === 'team' ? (gradeMap[partnerGrade] || 0) : 0;
    const maxGrade = Math.max(regNum, partNum);

    if (maxGrade === 12) {
      return { junior_beginner: false, junior_open: false, senior_beginner: false, senior_open: true };
    } else if (maxGrade === 10 || maxGrade === 11) {
      return { junior_beginner: false, junior_open: false, senior_beginner: true, senior_open: true };
    } else if (maxGrade === 9) {
      return { junior_beginner: false, junior_open: false, senior_beginner: true, senior_open: true };
    } else if (maxGrade >= 6 && maxGrade <= 8) {
      return { junior_beginner: true, junior_open: true, senior_beginner: false, senior_open: false };
    }
    return defaultCats;
  };

  const allowedSchoolCats = getAllowedSchoolCategories();

  // Reset category if no longer allowed under grade constraints
  useEffect(() => {
    if (isCalgarySummerCupStyle() && selectedCategory) {
      const allowed = 
        (selectedCategory === 'Junior Beginner' && allowedSchoolCats.junior_beginner) ||
        (selectedCategory === 'Junior Open' && allowedSchoolCats.junior_open) ||
        (selectedCategory === 'Senior Beginner' && allowedSchoolCats.senior_beginner) ||
        (selectedCategory === 'Senior Open' && allowedSchoolCats.senior_open);
      
      if (!allowed) {
        setSelectedCategory('');
      }
    }
  }, [registrantGrade, partnerGrade, selectedCategory]);

  // CUSID Tag Styles
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

  // Helper to render individual tournament cards
  const renderTournamentCard = (t) => {
    const cusid = getCusidStyles(t.cusidTag);
    return (
      <div
        key={t.id}
        className="exec-card lift-out-shadow animate-on-scroll fade-in"
        style={{
          background: 'rgba(17, 40, 84, 0.55)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Event flyer/banner fallback */}
        <div style={{ position: 'relative', height: '160px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {t.images && t.images[0] ? (
            <img src={t.images[0]} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>🎙️</div>
          )}
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', background: t.modality === 'online' ? '#2563eb' : '#059669', color: '#ffffff' }}>
              {t.modality}
            </span>
            {t.cusidTag && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', background: cusid.bg, color: cusid.color, border: cusid.border }}>
                {t.cusidTag}
              </span>
            )}
          </div>
        </div>

        {/* Event Content */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            {t.logo && (
              <img src={t.logo} alt="logo" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            )}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>
                {t.scope === 'international' ? '🌐 International' : '🇨🇦 Canada (Domestic)'} • {t.format} Format
              </span>
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0.25rem 0 0.5rem', fontWeight: 800 }}>{t.title}</h3>
            </div>
          </div>
          
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
              📅 {t.startDate === t.endDate ? t.startDate : `${t.startDate} - ${t.endDate}`}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              🏫 Host: {t.hostedByUCalgary ? 'University of Calgary' : t.hostingUniversity} {t.scope === 'international' ? `(${t.country})` : ''}
            </p>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '0.25rem 0' }}></div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {t.levels?.map(lvl => (
              <span key={lvl} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                {lvl === 'highschool' ? 'High School' : lvl === 'juniorhigh' ? 'Junior High' : lvl}
              </span>
            ))}
            {t.categories?.map(cat => (
              <span key={cat} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#fdba74', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                {cat}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
            <Link
              to={`/events/tournaments?id=${t.id}`}
              className="button"
              style={{ width: '100%', textDecoration: 'none', textAlign: 'center', padding: '0.75rem 0', display: 'block', fontWeight: 700 }}
            >
              Details & Register
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Group schedule items by Day
  const getGroupedSchedule = (schedule) => {
    if (!schedule) return {};
    const grouped = {};
    schedule.forEach(item => {
      const d = item.day || 1;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(item);
    });
    return grouped;
  };

  const handleInputChange = (fieldId, val) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  // Form Submit Handler
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;

    // Validate email inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.emailAddress && !emailRegex.test(formData.emailAddress.trim())) {
      alert("Please enter a valid email address.");
      return;
    }
    if (formData.partnerEmail && !emailRegex.test(formData.partnerEmail.trim())) {
      alert("Please enter a valid partner email address.");
      return;
    }

    // Dynamic field validation
    const missing = [];
    selectedTournament.formFields?.forEach(f => {
      // Exclude schoolName as it is always optional
      if (f.id === 'schoolName') return;
      
      // Exclude gradeLevel if university level is active
      if (f.id === 'gradeLevel' && selectedTournament.levels?.includes('university')) return;

      if (f.required && !formData[f.id]?.trim()) {
        missing.push(f.label);
      }
    });

    if (missing.length > 0) {
      alert(`Please fill in the following required fields: ${missing.join(', ')}`);
      return;
    }

    // Category requirement checks
    const hasCategoryChoices = selectedTournament.categories && selectedTournament.categories.length > 0;
    if (hasCategoryChoices && !selectedCategory) {
      alert("Please select a competition category.");
      return;
    }

    // Enforce Calgary Summer Cup grade checks
    if (isCalgarySummerCupStyle()) {
      if (!registrantGrade) {
        alert("Please select your Grade / year.");
        return;
      }
      if (selectedTournament.signupType === 'team' && !partnerGrade) {
        alert("Please select your partner's Grade / year.");
        return;
      }
    }

    // Enforce University novice restrictions
    const isUniv = selectedTournament.levels?.includes('university');
    const isBegCat = selectedCategory === 'beginner' || selectedCategory === 'Junior Beginner' || selectedCategory === 'Senior Beginner';
    if (isUniv && isBegCat) {
      const isTeam = selectedTournament.signupType === 'team';
      const registrantExperienced = !registrantIsNovice;
      const partnerExperienced = isTeam && !partnerIsNovice;
      if (registrantExperienced || partnerExperienced) {
        alert("Experienced (non-novice) debaters are not eligible for the Novice category. Please select the Open category.");
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Save to `tournament-registrations`
      const registrationData = {
        tournamentId: selectedTournament.id,
        tournamentTitle: selectedTournament.title,
        registeredAt: new Date().toISOString(),
        signupType: selectedTournament.signupType || 'individual',
        category: selectedCategory,
        subscribedToMailingList: subscribeToMailing,
        gradeLevel: registrantGrade || formData.gradeLevel || '',
        partnerGradeLevel: partnerGrade || '',
        registrantIsNovice,
        partnerIsNovice,
        ...formData
      };

      await addDoc(collection(db, 'tournament-registrations'), registrationData);

      // 2. Sync to central `subscribers` mailing list if checked
      if (subscribeToMailing) {
        const getListType = (levels) => {
          if (levels?.includes('juniorhigh')) return 'junior_high_students';
          if (levels?.includes('highschool')) return 'high_school_students';
          return 'subscribers';
        };

        const listType = getListType(selectedTournament.levels);
        const timestamp = new Date().toISOString();

        // Registrant Sync
        await addDoc(collection(db, 'subscribers'), {
          email: formData.emailAddress?.trim().toLowerCase(),
          fullName: `${formData.firstName?.trim()} ${formData.lastName?.trim()}`,
          firstName: formData.firstName?.trim(),
          lastName: formData.lastName?.trim(),
          grade: registrantGrade || formData.gradeLevel || '',
          listType,
          lists: [listType],
          subscribed: true,
          active: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          debater: true,
          novice: isBegCat,
          volunteer: false,
          judge: false
        });

        // Partner Sync
        if (selectedTournament.signupType === 'team' && formData.partnerEmail) {
          await addDoc(collection(db, 'subscribers'), {
            email: formData.partnerEmail?.trim().toLowerCase(),
            fullName: `${formData.partnerFirstName?.trim()} ${formData.partnerLastName?.trim()}`,
            firstName: formData.partnerFirstName?.trim(),
            lastName: formData.partnerLastName?.trim(),
            grade: partnerGrade || '',
            listType,
            lists: [listType],
            subscribed: true,
            active: true,
            createdAt: timestamp,
            updatedAt: timestamp,
            debater: true,
            novice: isBegCat,
            volunteer: false,
            judge: false
          });
        }
      }

      alert(`Successfully registered for ${selectedTournament.title}!`);
      // Reset form
      const reset = {};
      selectedTournament.formFields?.forEach(f => {
        reset[f.id] = '';
      });
      setFormData(reset);
      setSelectedCategory('');
      setRegistrantGrade('');
      setPartnerGrade('');
      setRegistrantIsNovice(false);
      setPartnerIsNovice(false);
      navigate('/events');
    } catch (err) {
      console.error("Error submitting registration:", err);
      alert("Failed to submit registration. Please verify connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: '#0b1329' }}>
      <VectorFlow />
      {/* Visual Header Graphic Background Spacer */}
      <section className="events-page-banner" style={{ background: 'transparent', height: '100px', minHeight: 'auto' }}></section>

      <section className="section" style={{ minHeight: '80vh', position: 'relative', background: 'transparent', zIndex: 1 }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div className="accent-glow" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Loading active tournaments...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !selectedTournament ? (
            // -------------------------------------------------------------
            // LIST VIEW (ALL TOURNAMENTS)
            // -------------------------------------------------------------
            <div>
              <div className="section-header straddle animate-on-scroll fade-in-left">
                <h1 className="title-box"><span>Tournament Portal</span></h1>
              </div>
              <p className="section-copy" style={{ marginBottom: '3rem' }}>
                UCDS Hosted Tournaments
              </p>

              {tournaments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  background: 'rgba(17, 40, 84, 0.45)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '1.5rem',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                  <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.5rem' }}>Where'd The Tournaments Go?</h3>
                  <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                    Did someone eat them all?
                  </p>
                </div>
              ) : (
                <div>
                  {/* Showcase 1: University of Calgary Hosted Tournaments */}
                  <div style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      🏫 University of Calgary Tournaments
                    </h2>
                    {tournaments.filter(t => t.hostedByUCalgary).length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.5rem' }}>No upcoming U of C hosted tournaments scheduled at this time.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {tournaments.filter(t => t.hostedByUCalgary).map(t => renderTournamentCard(t))}
                      </div>
                    )}
                  </div>

                  {/* Showcase 2: Non-University of Calgary Hosted Tournaments */}
                  <div>
                    <h2 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '1.5rem', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      🌐 Sponsored & External Tournaments
                    </h2>
                    {tournaments.filter(t => !t.hostedByUCalgary).length === 0 ? (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.5rem' }}>No upcoming external tournaments scheduled at this time.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {tournaments.filter(t => !t.hostedByUCalgary).map(t => renderTournamentCard(t))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // -------------------------------------------------------------
            // DETAILS VIEW (INDIVIDUAL TOURNAMENT SELECTED)
            // -------------------------------------------------------------
            <div className="animate-on-scroll fade-in">
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                  <p style={{ color: '#cbd5e1' }}>Loading details...</p>
                </div>
              ) : (
                <div>
                  {/* Back Link */}
                  <Link
                    to="/events/tournaments"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontWeight: 600,
                      marginBottom: '2rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
                  >
                    ← Back to Tournaments
                  </Link>

                  {/* Header Showcase Card */}
                  <div
                    style={{
                      background: 'rgba(17, 40, 84, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '1.5rem',
                      padding: '2.5rem',
                      marginBottom: '2.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      {/* Left: Info details */}
                      <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          {selectedTournament.logo && (
                            <img src={selectedTournament.logo} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          )}
                          <div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', background: selectedTournament.modality === 'online' ? '#2563eb' : '#059669', color: '#ffffff' }}>
                                {selectedTournament.modality}
                              </span>
                              {selectedTournament.cusidTag && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '999px',
                                  textTransform: 'uppercase',
                                  ...getCusidStyles(selectedTournament.cusidTag)
                                }}>
                                  {selectedTournament.cusidTag} Title
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                                {selectedTournament.format}
                              </span>
                            </div>
                            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                              {selectedTournament.title}
                            </h1>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                          <p style={{ color: '#60a5fa', fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0' }}>
                            📅 {selectedTournament.startDate === selectedTournament.endDate ? selectedTournament.startDate : `${selectedTournament.startDate} to ${selectedTournament.endDate}`}
                          </p>
                          <div>🏫 <strong>Hosting Team:</strong> {selectedTournament.hostedByUCalgary ? 'University of Calgary' : selectedTournament.hostingUniversity}</div>
                          <div>🌐 <strong>Scope:</strong> {selectedTournament.scope === 'international' ? `International (Country: ${selectedTournament.country})` : 'Canada (Domestic)'}</div>
                          {selectedTournament.modality === 'online' && selectedTournament.onlineLink && (
                            <div>🔗 <strong>Online Link:</strong> <a href={selectedTournament.onlineLink} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Join Server</a></div>
                          )}
                          {selectedTournament.modality === 'in-person' && selectedTournament.venueLocation && (
                            <div>📍 <strong>Venue Location:</strong> {selectedTournament.venueLocation}</div>
                          )}
                          <div>⏰ <strong>Timezone:</strong> {selectedTournament.timezone || 'MST'}</div>
                        </div>
                      </div>

                      {/* Right: Images visuals */}
                      {selectedTournament.images && selectedTournament.images.length > 0 && (
                        <div style={{ flex: 1.2, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', height: '200px' }}>
                            <img src={selectedTournament.images[0]} alt="Flyer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {selectedTournament.images.length > 1 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                              {selectedTournament.images.slice(1, 4).map((img, i) => (
                                <div key={i} style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '55px' }}>
                                  <img src={img} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Grid: Schedule & Registration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
                    
                    {/* LEFT COLUMN: Schedule */}
                    <div>
                      <div className="section-header animate-on-scroll fade-in-left" style={{ marginBottom: '1.5rem' }}>
                        <h2><span>Schedule Details</span></h2>
                      </div>
                      
                      {selectedTournament.schedule && selectedTournament.schedule.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {Object.entries(getGroupedSchedule(selectedTournament.schedule)).map(([day, items]) => (
                            <div key={day} style={{ background: 'rgba(10,25,59,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.25rem', padding: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(96,165,250,0.15)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem', color: '#60a5fa', fontWeight: 800, margin: 0 }}>
                                  Day {day} Schedule
                                </h3>
                                {selectedTournament.dayStartTimes && selectedTournament.dayStartTimes[day] && (
                                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                                    ⏰ Starts at: {selectedTournament.dayStartTimes[day]}
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.85rem 1.25rem',
                                      borderRadius: '0.5rem',
                                      background: item.type === 'round' ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '0.25rem',
                                        background: item.type === 'round' ? '#2563eb' : '#4b5563',
                                        color: '#ffffff',
                                        textTransform: 'uppercase'
                                      }}>
                                        {item.type}
                                      </span>
                                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
                                      ⏱️ {item.duration || '1hr'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#cbd5e1' }}>No schedule detailed for this tournament.</p>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Auto-generated Registration Form */}
                    <div>
                      <div className="section-header animate-on-scroll fade-in-left" style={{ marginBottom: '1.5rem' }}>
                        <h2><span>Register Portal</span></h2>
                      </div>

                      <div
                        style={{
                          background: 'rgba(17, 40, 84, 0.55)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '1.5rem',
                          padding: '2.5rem',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, marginBottom: '0.5rem' }}>Sign Up for {selectedTournament.title}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>Please enter participant details. Mode: <strong style={{ color: '#60a5fa', textTransform: 'capitalize' }}>{selectedTournament.signupType || 'individual'}</strong>.</p>

                        {/* Fee Details Block */}
                        {(selectedTournament.pricePerDebater !== undefined || selectedTournament.pricePerJudge !== undefined || selectedTournament.paymentMethods?.length > 0) && (
                          <div style={{
                            padding: '1.25rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem',
                            marginBottom: '1.75rem',
                            fontSize: '0.9rem'
                          }}>
                            <h4 style={{ margin: '0 0 0.75rem', color: '#60a5fa', fontWeight: 800, fontSize: '1rem' }}>💳 Registration Fees & Payment</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#cbd5e1' }}>
                              {selectedTournament.pricePerDebater !== undefined && (
                                <div>
                                  💰 <strong>Debater Fee:</strong> ${selectedTournament.pricePerDebater} CAD / debater
                                  {selectedTournament.signupType === 'team' && (
                                    <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8, marginLeft: '1.25rem' }}>
                                      (Calculated Team Fee: ${selectedTournament.teamCost || (selectedTournament.pricePerDebater * 2)} CAD)
                                    </span>
                                  )}
                                </div>
                              )}
                              {selectedTournament.pricePerJudge !== undefined && (
                                <div>⚖️ <strong>Judge Fee:</strong> ${selectedTournament.pricePerJudge} CAD / judge</div>
                              )}
                              {selectedTournament.noJudgeFeeEnabled && (
                                <div style={{ color: '#fca5a5' }}>
                                  ⚠️ <strong>Missing Judge Fee:</strong> Incurs additional ${selectedTournament.noJudgeFeeAmount} CAD penalty fee if team does not provide a judge.
                                </div>
                              )}
                              {selectedTournament.paymentMethods && selectedTournament.paymentMethods.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <strong>Payment Methods:</strong>
                                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {selectedTournament.paymentMethods.map(m => {
                                      const label = m === 'etransfer' ? 'E-Transfer' : m === 'stripe' ? 'Credit/Debit' : m === 'cashcheque' ? 'Cash/Cheque' : m === 'paypal' ? 'PayPal' : m;
                                      return (
                                        <span key={m} style={{ fontSize: '0.75rem', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <form onSubmit={handleSubmitRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          
                          {/* Calgary Summer Cup Rule Dropdowns */}
                          {isCalgarySummerCupStyle() && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '0.75rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa' }}>Registrant Grade Level *</label>
                                <select
                                  value={registrantGrade}
                                  onChange={e => setRegistrantGrade(e.target.value)}
                                  required
                                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                                >
                                  <option value="">-- Select Grade --</option>
                                  {Object.keys(gradeMap).map(g => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                              </div>

                              {selectedTournament.signupType === 'team' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa' }}>Partner Grade Level *</label>
                                  <select
                                    value={partnerGrade}
                                    onChange={e => setPartnerGrade(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(10,25,59,0.9)', color: '#ffffff' }}
                                  >
                                    <option value="">-- Select Grade --</option>
                                    {Object.keys(gradeMap).map(g => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Dynamic Inputs Generation */}
                          {selectedTournament.formFields?.map(field => {
                            // Grade is handled separately for school cup, hide it here if so
                            if (field.id === 'gradeLevel' && isCalgarySummerCupStyle()) return null;

                            // University level hides grade Level completely
                            if (field.id === 'gradeLevel' && selectedTournament.levels?.includes('university')) return null;

                            const isReq = field.required && field.id !== 'schoolName'; // School name is always optional
                            
                            return (
                              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                                  {field.label} {isReq && <span style={{ color: '#ef4444' }}>*</span>}
                                </label>

                                {field.id === 'dietaryAllergies' ? (
                                  <textarea
                                    value={formData[field.id] || ''}
                                    onChange={e => handleInputChange(field.id, e.target.value)}
                                    placeholder="Enter any dietary details or food allergies..."
                                    rows="2"
                                    style={{
                                      width: '100%',
                                      padding: '0.8rem',
                                      borderRadius: '0.5rem',
                                      background: 'rgba(0,0,0,0.25)',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      color: '#ffffff',
                                      fontSize: '0.95rem',
                                      outline: 'none',
                                      fontFamily: 'inherit',
                                      resize: 'none'
                                    }}
                                  />
                                ) : (
                                  <input
                                    type={field.type || 'text'}
                                    value={formData[field.id] || ''}
                                    onChange={e => handleInputChange(field.id, e.target.value)}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    required={isReq}
                                    style={{
                                      width: '100%',
                                      padding: '0.8rem 1rem',
                                      borderRadius: '0.5rem',
                                      background: 'rgba(0,0,0,0.25)',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      color: '#ffffff',
                                      fontSize: '0.95rem',
                                      outline: 'none'
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}

                          {/* University Level Novice checkboxes */}
                          {selectedTournament.levels?.includes('university') && selectedTournament.categories?.includes('beginner') && selectedTournament.categories?.includes('open') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '0.75rem', marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>Novice Eligibility Status</span>
                              
                              <div
                                onClick={() => setRegistrantIsNovice(!registrantIsNovice)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  cursor: 'pointer',
                                  padding: '0.5rem 0'
                                }}
                              >
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  border: '2px solid #c084fc',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: registrantIsNovice ? '#c084fc' : 'transparent',
                                  boxShadow: registrantIsNovice ? '0 0 8px #c084fc' : 'none',
                                  transition: 'all 0.2s'
                                }}>
                                  {registrantIsNovice && <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>I am a novice debater (≤ 1 year experience)</span>
                              </div>

                              {selectedTournament.signupType === 'team' && (
                                <div
                                  onClick={() => setPartnerIsNovice(!partnerIsNovice)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    cursor: 'pointer',
                                    padding: '0.5rem 0'
                                  }}
                                >
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    border: '2px solid #c084fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: partnerIsNovice ? '#c084fc' : 'transparent',
                                    boxShadow: partnerIsNovice ? '0 0 8px #c084fc' : 'none',
                                    transition: 'all 0.2s'
                                  }}>
                                    {partnerIsNovice && <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                                  </div>
                                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>My partner is a novice debater</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Category Choice Selectors */}
                          {selectedTournament.categories && selectedTournament.categories.length > 0 && (
                            <div className="form-group" style={{ marginTop: '0.5rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Competition Division Category *</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                
                                {isCalgarySummerCupStyle() ? (
                                  // Render Calgary Summer Cup Division buttons
                                  <>
                                    {allowedSchoolCats.junior_beginner && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCategory('Junior Beginner')}
                                        style={{
                                          padding: '0.8rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          background: selectedCategory === 'Junior Beginner' ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.2)',
                                          color: selectedCategory === 'Junior Beginner' ? '#60a5fa' : '#cbd5e1',
                                          borderColor: selectedCategory === 'Junior Beginner' ? '#60a5fa' : 'rgba(255,255,255,0.15)',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          textAlign: 'left'
                                        }}
                                      >
                                        🌱 Junior Beginner (Grades 6 - 8 novice)
                                      </button>
                                    )}
                                    {allowedSchoolCats.junior_open && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCategory('Junior Open')}
                                        style={{
                                          padding: '0.8rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          background: selectedCategory === 'Junior Open' ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.2)',
                                          color: selectedCategory === 'Junior Open' ? '#60a5fa' : '#cbd5e1',
                                          borderColor: selectedCategory === 'Junior Open' ? '#60a5fa' : 'rgba(255,255,255,0.15)',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          textAlign: 'left'
                                        }}
                                      >
                                        🏆 Junior Open (Grades 6 - 8 open)
                                      </button>
                                    )}
                                    {allowedSchoolCats.senior_beginner && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCategory('Senior Beginner')}
                                        style={{
                                          padding: '0.8rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          background: selectedCategory === 'Senior Beginner' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                                          color: selectedCategory === 'Senior Beginner' ? '#ffffff' : '#cbd5e1',
                                          borderColor: selectedCategory === 'Senior Beginner' ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          textAlign: 'left'
                                        }}
                                      >
                                        🌱 Senior Beginner (Grades 9 - 12 novice)
                                      </button>
                                    )}
                                    {allowedSchoolCats.senior_open && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCategory('Senior Open')}
                                        style={{
                                          padding: '0.8rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          background: selectedCategory === 'Senior Open' ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.2)',
                                          color: selectedCategory === 'Senior Open' ? '#60a5fa' : '#cbd5e1',
                                          borderColor: selectedCategory === 'Senior Open' ? '#60a5fa' : 'rgba(255,255,255,0.15)',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          textAlign: 'left'
                                        }}
                                      >
                                        🏆 Senior Open (Grades 9 - 12 open)
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  // Render standard categories selected by executive
                                  selectedTournament.categories.map(c => {
                                    const label = c === 'beginner' ? '🌱 Novice / Beginner Category' : '🏆 Open Category';
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => setSelectedCategory(c)}
                                        style={{
                                          padding: '0.8rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255,255,255,0.15)',
                                          background: selectedCategory === c ? 'rgba(96,165,250,0.15)' : 'rgba(0,0,0,0.2)',
                                          color: selectedCategory === c ? '#60a5fa' : '#cbd5e1',
                                          borderColor: selectedCategory === c ? '#60a5fa' : 'rgba(255,255,255,0.15)',
                                          cursor: 'pointer',
                                          fontWeight: 700,
                                          textAlign: 'left'
                                        }}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })
                                )}

                              </div>
                            </div>
                          )}

                          {/* Email newsletter check */}
                          <div
                            onClick={() => setSubscribeToMailing(!subscribeToMailing)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              padding: '0.5rem 0',
                              marginTop: '0.5rem'
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
                              background: subscribeToMailing ? '#60a5fa' : 'transparent',
                              boxShadow: subscribeToMailing ? '0 0 8px #60a5fa' : 'none',
                              transition: 'all 0.2s'
                            }}>
                              {subscribeToMailing && <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Subscribe to UCDS mailing list for updates</span>
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="button"
                            style={{
                              marginTop: '1.5rem',
                              width: '100%',
                              padding: '0.9rem',
                              fontWeight: 750,
                              fontSize: '1rem',
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {submitting ? 'Submitting Registration...' : 'Submit Registration ✓'}
                          </button>
                        </form>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

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
