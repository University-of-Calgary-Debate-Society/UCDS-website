import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import { useDialog } from '../../../../../context/DialogContext';

const PRESET_INSTITUTIONS = [
  { name: 'University of Calgary', club: 'University of Calgary Debate Society', country: 'Canada', region: 'Alberta', city: 'Calgary' },
  { name: 'University of Alberta', club: 'University of Alberta Debate Society', country: 'Canada', region: 'Alberta', city: 'Edmonton' },
  { name: 'University of British Columbia', club: 'University of British Columbia Debate Society', country: 'Canada', region: 'British Columbia', city: 'Vancouver' },
  { name: 'University of Toronto (Hart House)', club: 'Hart House Debating Club', country: 'Canada', region: 'Ontario', city: 'Toronto' },
  { name: 'University of Toronto (St. George)', club: 'The University of Toronto St. George Debate Club', country: 'Canada', region: 'Ontario', city: 'Toronto' },
  { name: 'University of Western Ontario', club: 'University of Western Ontario Debate Society', country: 'Canada', region: 'Ontario', city: 'London' },
  { name: 'University of Waterloo', club: 'University of Waterloo Debate Society', country: 'Canada', region: 'Ontario', city: 'Waterloo' },
  { name: 'University of Saskatchewan', club: 'University of Saskatchewan Debate Society', country: 'Canada', region: 'Saskatchewan', city: 'Saskatoon' },
  { name: 'University of Manitoba', club: 'University of Manitoba Debate Club', country: 'Canada', region: 'Manitoba', city: 'Winnipeg' },
  { name: 'McGill University', club: 'McGill Debating Union', country: 'Canada', region: 'Quebec', city: 'Montreal' },
  { name: 'University of Ottawa', club: 'English Debating Society', country: 'Canada', region: 'Ontario', city: 'Ottawa' }
];

export default function Help() {
  const navigate = useNavigate();
  const { alert } = useDialog();

  // Step tracker
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [tournament, setTournament] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedInst, setSelectedInst] = useState(null); // { name, club, city, region, country }
  const [selectedUofTClub, setSelectedUofTClub] = useState(''); // 'Hart House' or 'St. George'

  // Experience Fields (Step 2)
  const [yearsDebated, setYearsDebated] = useState('');
  const [tournamentsJudged, setTournamentsJudged] = useState('');
  const [tournamentsJudgedSecondary, setTournamentsJudgedSecondary] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');

  // Round availability (Step 2 - Calgary Cup only)
  const [selectedRounds, setSelectedRounds] = useState({
    'Round 1 (Saturday, July 25 9:30-10:45)': false,
    'Round 2 (Saturday, July 25 10:45-12:00)': false,
    'Round 3 (Saturday, July 25 1:15-2:30)': false,
    'Round 4 (Saturday, July 25 2:45-4:00)': false,
    'Semi-Finals (Sunday, July 26 10:00-11:30)': false,
    'Finals (Sunday, July 26 12:45-2:30)': false
  });

  // Modal Popups
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [instSearch, setInstSearch] = useState('');

  // Seed institutions database if empty
  useEffect(() => {
    const seedInstitutions = async () => {
      try {
        const instCol = collection(db, 'institutions');
        const q = query(instCol, limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          for (const inst of PRESET_INSTITUTIONS) {
            await addDoc(instCol, inst);
          }
        }
      } catch (err) {
        console.error("Failed to seed institutions:", err);
      }
    };
    seedInstitutions();
  }, []);

  const handleSelectTournament = (choice) => {
    setTournament(choice);
    setShowTournamentModal(false);
  };

  const handleSelectInst = (inst) => {
    if (inst.name.includes('University of Toronto')) {
      setSelectedInst({ ...inst, isUofT: true });
    } else {
      setSelectedInst(inst);
      setSelectedUofTClub('');
    }
    setShowInstModal(false);
  };

  const toggleRound = (round) => {
    setSelectedRounds(prev => ({
      ...prev,
      [round]: !prev[round]
    }));
  };

  const validateStep1 = () => {
    if (!tournament) {
      alert("Please select which tournament you are registering for.");
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }
    if (!selectedInst) {
      alert("Please select your academic institution.");
      return false;
    }
    if (selectedInst.isUofT && !selectedUofTClub) {
      alert("Please select which University of Toronto club you belong to.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 2) return;

    // Validate Step 2 numeric values
    const numRegex = /^\d+$/;
    if (!numRegex.test(yearsDebated.trim())) {
      alert("Please enter a valid numeric value for years debated.");
      return;
    }
    if (!numRegex.test(tournamentsJudged.trim())) {
      alert("Please enter a valid numeric value for tournaments judged.");
      return;
    }
    if (!numRegex.test(tournamentsJudgedSecondary.trim())) {
      alert("Please enter a valid numeric value for secondary tournaments judged.");
      return;
    }

    if (tournament === 'Calgary Summer Cup') {
      const selectedRoundList = Object.keys(selectedRounds).filter(k => selectedRounds[k]);
      if (selectedRoundList.length === 0) {
        alert("Please select at least one round you are available to judge.");
        return;
      }
      if (!discordUsername.trim()) {
        alert("Please enter your discord username.");
        return;
      }
    }

    setLoading(true);

    try {
      // Determine actual club and details based on U of T club choice
      let finalClub = selectedInst.club;
      if (selectedInst.isUofT) {
        finalClub = selectedUofTClub === 'Hart House' 
          ? 'Hart House Debating Club' 
          : 'The University of Toronto St. George Debate Club';
      }

      const adjudicatorData = {
        tournament,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institution: selectedInst.name.split(' (')[0], // strip brackets
        club: finalClub,
        city: selectedInst.city,
        region: selectedInst.region,
        country: selectedInst.country,
        yearsDebated: parseInt(yearsDebated),
        tournamentsJudged: parseInt(tournamentsJudged),
        tournamentsJudgedSecondary: parseInt(tournamentsJudgedSecondary),
        createdAt: new Date().toISOString()
      };

      if (tournament === 'Calgary Summer Cup') {
        adjudicatorData.discordUsername = discordUsername.trim();
        adjudicatorData.rounds = Object.keys(selectedRounds).filter(k => selectedRounds[k]);
      }

      // 1. Save to adjudicators collection
      await addDoc(collection(db, 'adjudicators'), adjudicatorData);

      // 2. Sync to subscribers mailing list collection
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', email.trim().toLowerCase()));
      const snap = await getDocs(q);

      const subscriberPayload = {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim(),
        institution: selectedInst.name.split(' (')[0],
        club: finalClub,
        city: selectedInst.city,
        region: selectedInst.region,
        country: selectedInst.country,
        listType: 'adjudicators',
        lists: ['adjudicators', 'newsletter'],
        active: true,
        updatedAt: new Date().toISOString()
      };

      if (snap.empty) {
        await addDoc(subscribersRef, {
          ...subscriberPayload,
          createdAt: new Date().toISOString()
        });
      } else {
        const docRef = doc(db, 'subscribers', snap.docs[0].id);
        await updateDoc(docRef, subscriberPayload);
      }

      setLoading(false);
      navigate('/help/thanks');
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Submission failed: " + err.message);
    }
  };

  // Filter preset institutions
  const filteredInsts = PRESET_INSTITUTIONS.filter(i => 
    i.name.toLowerCase().includes(instSearch.toLowerCase()) || 
    i.club.toLowerCase().includes(instSearch.toLowerCase())
  );

  return (
    <main className="help-registration-page" style={{ background: '#0b1a3a', color: '#ffffff', minHeight: '100vh', padding: '4rem 0', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="container" style={{ maxWidth: '650px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem', background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Independent Adjudicator Registration
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Join our judging panels and contribute to high-quality academic debate.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step === 1 ? '#2563eb' : '#1e293b',
              border: step === 1 ? 'none' : '1px solid #3b82f6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>1</span>
            <span style={{ color: step === 1 ? '#ffffff' : '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>Details</span>
          </div>
          <div style={{ width: '40px', height: '1px', background: '#334155', alignSelf: 'center' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step === 2 ? '#2563eb' : '#1e293b',
              border: step === 2 ? 'none' : '1px solid rgba(255,255,255,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>2</span>
            <span style={{ color: step === 2 ? '#ffffff' : '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>Experience</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'rgba(17, 40, 84, 0.45)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)'
        }}>

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Tournament Trigger Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Target Tournament</label>
                <button
                  type="button"
                  onClick={() => setShowTournamentModal(true)}
                  style={{
                    background: '#0d1b38',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: tournament ? '#ffffff' : '#94a3b8',
                    padding: '0.85rem 1.2rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {tournament || 'Select a tournament...'}
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
              </div>

              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    style={{
                      background: '#0d1b38',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      padding: '0.85rem 1.2rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    style={{
                      background: '#0d1b38',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      padding: '0.85rem 1.2rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  style={{
                    background: '#0d1b38',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    padding: '0.85rem 1.2rem',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-4567"
                  style={{
                    background: '#0d1b38',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#ffffff',
                    padding: '0.85rem 1.2rem',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Institution Trigger Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Institution</label>
                <button
                  type="button"
                  onClick={() => setShowInstModal(true)}
                  style={{
                    background: '#0d1b38',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.5rem',
                    color: selectedInst ? '#ffffff' : '#94a3b8',
                    padding: '0.85rem 1.2rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {selectedInst ? selectedInst.name : 'Select institution...'}
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
              </div>

              {/* U of T Club Secondary Selection */}
              {selectedInst && selectedInst.isUofT && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Select U of T Debating Club</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedUofTClub('Hart House')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: selectedUofTClub === 'Hart House' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                        background: selectedUofTClub === 'Hart House' ? 'rgba(59, 130, 246, 0.25)' : '#0d1b38',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Hart House Debating Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUofTClub('St. George')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: selectedUofTClub === 'St. George' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                        background: selectedUofTClub === 'St. George' ? 'rgba(59, 130, 246, 0.25)' : '#0d1b38',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      St. George Debate Club
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <Link
                  to="/events/hosted-tournaments"
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    padding: '0.85rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s'
                  }}
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.3s'
                  }}
                >
                  Next &rarr;
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: Experience & Rounds */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Calgary Summer Cup Specific Fields */}
              {tournament === 'Calgary Summer Cup' && (
                <>
                  {/* Compensation Block */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '0.75rem',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#a7f3d0'
                  }}>
                    💡 <strong>IA Details & Compensation:</strong> Independent Adjudicators are expected to be able to chair a debate room on their own. Compensation is paid at a rate of <strong>$15.00 per round</strong>. We will contact you closer to the tournament date regarding slot confirmations.
                  </div>

                  {/* Rounds Selection List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Rounds Availability (Select all that apply)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(selectedRounds).map((round) => (
                        <button
                          key={round}
                          type="button"
                          onClick={() => toggleRound(round)}
                          style={{
                            background: selectedRounds[round] ? 'rgba(59, 130, 246, 0.2)' : '#0d1b38',
                            border: selectedRounds[round] ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.15)',
                            color: selectedRounds[round] ? '#ffffff' : '#94a3b8',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {round}
                          <span>{selectedRounds[round] ? '✓' : ''}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discord Username */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Discord Username</label>
                    <input
                      type="text"
                      value={discordUsername}
                      onChange={(e) => setDiscordUsername(e.target.value)}
                      placeholder="username#0000 or username"
                      style={{
                        background: '#0d1b38',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        padding: '0.85rem 1.2rem',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </>
              )}

              {/* General Experience Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Years Debated */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Years of Debate Experience</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={yearsDebated}
                    onChange={(e) => setYearsDebated(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 2"
                    style={{
                      background: '#0d1b38',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      padding: '0.85rem 1.2rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Tournaments Judged */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Tournaments Judged (as Panel/Chair)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={tournamentsJudged}
                    onChange={(e) => setTournamentsJudged(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5"
                    style={{
                      background: '#0d1b38',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      padding: '0.85rem 1.2rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Tournaments Judged (Secondary/Junior divisions) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>Tournaments Competed in (as Competitor)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={tournamentsJudgedSecondary}
                    onChange={(e) => setTournamentsJudgedSecondary(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 8"
                    style={{
                      background: '#0d1b38',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ffffff',
                      padding: '0.85rem 1.2rem',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.3s',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>

            </div>
          )}

        </form>
      </div>

      {/* TOURNAMENT SELECT MODAL */}
      {showTournamentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 25, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#0d1b38',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '1.25rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#ffffff', fontSize: '1.3rem', fontWeight: 700 }}>Choose Target Tournament</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => handleSelectTournament('Calgary Summer Cup')}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                🏆 Calgary Summer Cup
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 400 }}>Active - July 25-26, 2026</div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTournament('General Registration')}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
              >
                📬 General Registration
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 400 }}>Save details for future invitations</div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowTournamentModal(false)}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.75rem',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* INSTITUTION SELECT MODAL WITH SEARCH */}
      {showInstModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 25, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#0d1b38',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '1.25rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 1rem', color: '#ffffff', fontSize: '1.3rem', fontWeight: 700 }}>Choose Institution</h3>
            
            {/* Search Input */}
            <input
              type="text"
              value={instSearch}
              onChange={(e) => setInstSearch(e.target.value)}
              placeholder="Search by name or debating club..."
              style={{
                background: '#071126',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: '1rem'
              }}
            />

            {/* List Container */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
              {filteredInsts.map((inst, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectInst(inst)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{inst.name.split(' (')[0]}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Club: {inst.club} | {inst.city}, {inst.region}
                  </div>
                </button>
              ))}
              {filteredInsts.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  No institutions found.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowInstModal(false)}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.75rem',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
