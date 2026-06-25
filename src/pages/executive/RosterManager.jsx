import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function RosterManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Executive state
  const [executivesList, setExecutivesList] = useState([]);
  const [execsLoading, setExecsLoading] = useState(true);

  // Form states
  const [execName, setExecName] = useState('');
  const [execRole, setExecRole] = useState('');
  const [execEmail, setExecEmail] = useState('');
  const [execPhoto, setExecPhoto] = useState('');
  const [execAboutMe, setExecAboutMe] = useState('');
  const [execExperience, setExecExperience] = useState('');
  const [execWhyJoined, setExecWhyJoined] = useState('');
  const [execOrder, setExecOrder] = useState('0');
  const [currentExecId, setCurrentExecId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // -------------------------------------------------------------
  // AUTH TRACKER
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthInitialized(true);
      if (authInitialized && !user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate, authInitialized]);

  // -------------------------------------------------------------
  // FETCH EXECUTIVES
  // -------------------------------------------------------------
  const fetchExecutives = async () => {
    setExecsLoading(true);
    try {
      const q = query(collection(db, 'executives'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setExecutivesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching executives list", err);
    } finally {
      setExecsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchExecutives();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------
  const handleSaveExecutive = async (e) => {
    e.preventDefault();
    if (!execName.trim() || !execRole.trim() || !execEmail.trim()) {
      alert("Name, role, and email are required fields.");
      return;
    }

    setSaveStatus("Saving profile...");
    const payload = {
      name: execName.trim(),
      role: execRole.trim(),
      email: execEmail.trim(),
      photo: execPhoto,
      aboutMe: execAboutMe.trim(),
      experience: execExperience.trim(),
      whyJoined: execWhyJoined.trim(),
      order: parseInt(execOrder, 10) || 0,
      updatedAt: new Date().toISOString()
    };

    try {
      if (currentExecId) {
        // Update
        const execDocRef = doc(db, 'executives', currentExecId);
        await updateDoc(execDocRef, payload);
        setSaveStatus("✅ Profile updated successfully!");
      } else {
        // Create
        await addDoc(collection(db, 'executives'), payload);
        setSaveStatus("✅ Profile added successfully!");
      }

      // Reset form
      handleResetForm();
      fetchExecutives();
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (err) {
      console.error("Error saving executive", err);
      setSaveStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleEditExecutive = (exec) => {
    setCurrentExecId(exec.id);
    setExecName(exec.name || '');
    setExecRole(exec.role || '');
    setExecEmail(exec.email || '');
    setExecPhoto(exec.photo || '');
    setExecAboutMe(exec.aboutMe || '');
    setExecExperience(exec.experience || '');
    setExecWhyJoined(exec.whyJoined || '');
    setExecOrder(String(exec.order || 0));
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExecutive = async (id) => {
    if (!await confirm("Are you sure you want to delete this executive profile?")) return;
    try {
      await deleteDoc(doc(db, 'executives', id));
      alert("Executive profile deleted.");
      fetchExecutives();
      if (currentExecId === id) {
        handleResetForm();
      }
    } catch (err) {
      console.error("Error deleting executive", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleResetForm = () => {
    setExecName('');
    setExecRole('');
    setExecEmail('');
    setExecPhoto('');
    setExecAboutMe('');
    setExecExperience('');
    setExecWhyJoined('');
    setExecOrder('0');
    setCurrentExecId('');
    setIsFormOpen(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile picture should be smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setExecPhoto(reader.result); // Base64 representation
    };
    reader.readAsDataURL(file);
  };

  if (!authInitialized) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Initializing roster manager...</p>
        </section>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Access Denied. Redirecting to portal...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1200px', margin: '4rem auto', textAlign: 'left' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Executive Roster Manager</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Easily update details of the executives below.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            {/* Status alerts */}
            {saveStatus && (
              <div style={{ background: saveStatus.includes('✅') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: saveStatus.includes('✅') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)', padding: '0.75rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {saveStatus}
              </div>
            )}

            {/* Editor Area */}
            {isFormOpen ? (
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem', marginBottom: '2.5rem', animation: 'fadeInTab 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#93c5fd', fontSize: '1.5rem' }}>{currentExecId ? 'Edit Executive Profile' : 'Add New Executive'}</h3>
                  <button onClick={handleResetForm} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                </div>

                <form onSubmit={handleSaveExecutive} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Full Name *</label>
                      <input type="text" value={execName} onChange={(e) => setExecName(e.target.value)} placeholder="Sofija Trkulja" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Role / Title *</label>
                      <input type="text" value={execRole} onChange={(e) => setExecRole(e.target.value)} placeholder="President" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Email Address *</label>
                      <input type="email" value={execEmail} onChange={(e) => setExecEmail(e.target.value)} placeholder="ucds.debate@gmail.com" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Sort Weight (Order) *</label>
                      <input type="number" value={execOrder} onChange={(e) => setExecOrder(e.target.value)} className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>About Me (Bio summary)</label>
                    <textarea value={execAboutMe} onChange={(e) => setExecAboutMe(e.target.value)} placeholder="A brief introduction about your role and what you do for UCDS..." rows="3" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Debate Experience</label>
                    <textarea value={execExperience} onChange={(e) => setExecExperience(e.target.value)} placeholder="Years of experience, main speaking style, or tournament records..." rows="2" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Why I Joined Debate</label>
                    <textarea value={execWhyJoined} onChange={(e) => setExecWhyJoined(e.target.value)} placeholder="What drew you to public speaking, CUSID debate, or the society..." rows="2" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }} />
                  </div>

                  {/* Profile Picture Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <label style={{ fontSize: '0.95rem', color: '#93c5fd', fontWeight: 'bold' }}>Profile Picture Upload</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer', marginTop: '0.25rem' }} />
                    {execPhoto ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                        <img src={execPhoto} alt="Live thumbnail" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb', boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' }} />
                        <button type="button" onClick={() => setExecPhoto('')} className="exec-btn exec-btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', background: '#dc2626', color: '#ffffff', cursor: 'pointer' }}>Remove Image</button>
                      </div>
                    ) : (
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.8rem' }}>No profile picture selected. Fallback default avatar will be used.</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '0.75rem' }}>
                    <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '10px 28px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                      {currentExecId ? 'Update Profile' : 'Create Profile'}
                    </button>
                    <button type="button" onClick={handleResetForm} className="exec-btn exec-btn-secondary" style={{ padding: '10px 24px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', fontSize: '0.95rem' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                <button onClick={() => setIsFormOpen(true)} className="exec-btn exec-btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Executive Officer
                </button>
              </div>
            )}

            {/* List Table Grid */}
            <h3 style={{ color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>Current Executive Directory</h3>
            
            {execsLoading ? (
              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', padding: '2rem 0' }}>Loading executive officers...</p>
            ) : executivesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0 0 1rem' }}>No executives found in the database.</p>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Tip: Go back to the dashboard and run the seeder under "Debugging" to populate default profiles.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {executivesList.map(exec => (
                  <div key={exec.id} className="profile-item-admin" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        {exec.photo ? (
                          <img src={exec.photo} alt={exec.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(37,99,235,0.4)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ width: '28px', height: '28px', color: '#60a5fa' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                          </div>
                        )}
                        <div>
                          <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: 'bold' }}>{exec.name}</h4>
                          <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>{exec.role}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><strong>Email:</strong> <span style={{ color: '#93c5fd' }}>{exec.email}</span></div>
                        <div><strong>Order weight:</strong> {exec.order || 0}</div>
                        {exec.aboutMe && <div style={{ marginTop: '0.5rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{exec.aboutMe}"</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                      <button onClick={() => handleEditExecutive(exec)} className="exec-btn exec-btn-secondary" style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>Edit Profile</button>
                      <button onClick={() => handleDeleteExecutive(exec.id)} className="exec-btn exec-btn-danger" style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
