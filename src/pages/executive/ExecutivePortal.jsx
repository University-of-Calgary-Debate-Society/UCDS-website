import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

const PANEL_THEMES = {
  ledger: {
    id: 'ledger',
    label: 'Financial Ledger',
    path: '/executive/ledger',
    color: '#10b981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderHoverColor: 'rgba(16, 185, 129, 0.45)',
    shadowColor: 'rgba(16, 185, 129, 0.1)',
    badgeColor: '#064e3b',
    badgeTextColor: '#34d399',
    btnBg: '#10b981',
    btnHoverBg: '#059669',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  roster: {
    id: 'roster',
    label: 'Executive Roster',
    path: '/executive/roster',
    color: '#f59e0b', // Amber
    bgColor: 'rgba(245, 158, 11, 0.04)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderHoverColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: 'rgba(245, 158, 11, 0.1)',
    badgeColor: '#78350f',
    badgeTextColor: '#fbbf24',
    btnBg: '#f59e0b',
    btnHoverBg: '#d97706',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  email: {
    id: 'email',
    label: 'Email Campaigns',
    path: '/executive/email',
    color: '#3b82f6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.04)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderHoverColor: 'rgba(59, 130, 246, 0.45)',
    shadowColor: 'rgba(59, 130, 246, 0.1)',
    badgeColor: '#1e3a8a',
    badgeTextColor: '#93c5fd',
    btnBg: '#3b82f6',
    btnHoverBg: '#2563eb',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  blog: {
    id: 'blog',
    label: 'Blog Manager',
    path: '/executive/blog',
    color: '#8b5cf6', // Violet
    bgColor: 'rgba(139, 92, 246, 0.04)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderHoverColor: 'rgba(139, 92, 246, 0.45)',
    shadowColor: 'rgba(139, 92, 246, 0.1)',
    badgeColor: '#4c1d95',
    badgeTextColor: '#c084fc',
    btnBg: '#8b5cf6',
    btnHoverBg: '#7c3aed',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2-2m2 2a2 2 0 11-4 0 2 2 0 014 0zM12 11h3m-3 3h3m-6-3h0m0 3h0" />
      </svg>
    )
  },
  access: {
    id: 'access',
    label: 'Access Control',
    path: '/executive/access',
    color: '#0d9488', // Teal
    bgColor: 'rgba(13, 148, 136, 0.04)',
    borderColor: 'rgba(13, 148, 136, 0.25)',
    borderHoverColor: 'rgba(13, 148, 136, 0.45)',
    shadowColor: 'rgba(13, 148, 136, 0.1)',
    badgeColor: '#115e59',
    badgeTextColor: '#2dd4bf',
    btnBg: '#0d9488',
    btnHoverBg: '#0f766e',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    )
  },
  socials: {
    id: 'socials',
    label: 'Posts Manager',
    path: '/executive/posts',
    color: '#ec4899', // Pink
    bgColor: 'rgba(236, 72, 153, 0.04)',
    borderColor: 'rgba(236, 72, 153, 0.25)',
    borderHoverColor: 'rgba(236, 72, 153, 0.45)',
    shadowColor: 'rgba(236, 72, 153, 0.1)',
    badgeColor: '#5b1236',
    badgeTextColor: '#f472b6',
    btnBg: '#ec4899',
    btnHoverBg: '#db2777',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  calendar: {
    id: 'calendar',
    label: 'Calendar Manager',
    path: '/executive/calendar',
    color: '#0ea5e9', // Sky Blue
    bgColor: 'rgba(14, 165, 233, 0.04)',
    borderColor: 'rgba(14, 165, 233, 0.25)',
    borderHoverColor: 'rgba(14, 165, 233, 0.45)',
    shadowColor: 'rgba(14, 165, 233, 0.1)',
    badgeColor: '#0c4a6e',
    badgeTextColor: '#38bdf8',
    btnBg: '#0ea5e9',
    btnHoverBg: '#0284c7',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  tournaments: {
    id: 'tournaments',
    label: 'Tournaments Manager',
    path: '/executive/events',
    color: '#a855f7', // Purple
    bgColor: 'rgba(168, 85, 247, 0.04)',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderHoverColor: 'rgba(168, 85, 247, 0.45)',
    shadowColor: 'rgba(168, 85, 247, 0.1)',
    badgeColor: '#581c87',
    badgeTextColor: '#e9d5ff',
    btnBg: '#a855f7',
    btnHoverBg: '#9333ea',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  membership: {
    id: 'membership',
    label: 'Membership Manager',
    path: '/executive/membership',
    color: '#34d399', // Emerald
    bgColor: 'rgba(52, 211, 153, 0.04)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderHoverColor: 'rgba(52, 211, 153, 0.45)',
    shadowColor: 'rgba(52, 211, 153, 0.1)',
    badgeColor: '#064e3b',
    badgeTextColor: '#6ee7b7',
    btnBg: '#34d399',
    btnHoverBg: '#059669',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  system: {
    id: 'system',
    label: 'System Debugging',
    path: '/executive/debug',
    color: '#f43f5e', // Rose
    bgColor: 'rgba(244, 63, 94, 0.04)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderHoverColor: 'rgba(244, 63, 94, 0.45)',
    shadowColor: 'rgba(244, 63, 94, 0.1)',
    badgeColor: '#881337',
    badgeTextColor: '#fda4af',
    btnBg: '#f43f5e',
    btnHoverBg: '#e11d48',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
};

export default function ExecutivePortal() {
  const { alert } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger');

  // Sign In / Sign Up Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard metrics states
  const [executivesCount, setExecutivesCount] = useState(0);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [instagramPostsCount, setInstagramPostsCount] = useState(0);
  const [allowedCount, setAllowedCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [tournamentsCount, setTournamentsCount] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [alumniCount, setAlumniCount] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // -------------------------------------------------------------
  // FIREBASE AUTH TRACKER
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoggedIn(!!user);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------
  // METRICS FETCHERS (DASHBOARD RUNTIME ONLY)
  // -------------------------------------------------------------
  const fetchDashboardMetrics = async () => {
    setMetricsLoading(true);
    try {
      // 1. Ledger Metrics
      const ledgerSnap = await getDocs(collection(db, 'ledger'));
      setLedgerCount(ledgerSnap.size);
      const txs = ledgerSnap.docs.map(doc => doc.data());
      const sortedLedger = [...txs].sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        if (b.index !== undefined && a.index !== undefined) {
          return b.index - a.index;
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      if (sortedLedger.length > 0) {
        setNetBalance(sortedLedger[0].balance || 0);
      } else {
        setNetBalance(0);
      }

      // 2. Executives
      const execsSnap = await getDocs(collection(db, 'executives'));
      setExecutivesCount(execsSnap.size);

      // 3. Subscribers & Members
      const subsSnap = await getDocs(collection(db, 'subscribers'));
      const allSubs = subsSnap.docs.map(doc => doc.data());
      setSubscribersCount(allSubs.length);
      
      const membersSnap = await getDocs(collection(db, 'members'));
      const allMembers = membersSnap.docs.map(doc => doc.data());
      setMembersCount(allMembers.filter(m => !m.alumni).length);
      setAlumniCount(allMembers.filter(m => m.alumni).length);

      // 4. Blog & Instagram Posts
      const postsSnap = await getDocs(collection(db, 'posts'));
      const allPosts = postsSnap.docs.map(doc => doc.data());
      setPostsCount(allPosts.filter(p => p.type !== 'instagram').length);
      setInstagramPostsCount(allPosts.filter(p => p.type === 'instagram').length);

      // 5. Allowed Signups
      const allowedSnap = await getDocs(collection(db, 'allowed_emails'));
      setAllowedCount(allowedSnap.size);

      // 6. Calendar Events
      const eventsSnap = await getDocs(collection(db, 'calendar_events'));
      setEventsCount(eventsSnap.size);

      // 7. Tournaments/Events
      const tournamentsSnap = await getDocs(collection(db, 'tournaments_and_events'));
      setTournamentsCount(tournamentsSnap.size);
    } catch (err) {
      console.error("Error loading dashboard stats", err);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardMetrics();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // AUTH MUTATIONS
  // -------------------------------------------------------------
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      alert("Please enter both email and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim().toLowerCase(), loginPassword);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      setAuthError(err.message || "Invalid credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const emailToSignUp = signupEmail.trim().toLowerCase();
    if (!emailToSignUp || !signupPassword) {
      alert("Please enter both email and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      // Query Firestore allowed_emails list first
      const allowedRef = collection(db, 'allowed_emails');
      const q = query(allowedRef, where('email', '==', emailToSignUp));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setAuthError("Unauthorized. This email is not in the executive allowed list.");
        setAuthLoading(false);
        return;
      }

      // Proceed with user creation in Firebase Auth
      await createUserWithEmailAndPassword(auth, emailToSignUp, signupPassword);
      
      // Seed subscriber profile
      await addDoc(collection(db, 'subscribers'), {
        email: emailToSignUp,
        fullName: signupName.trim() || 'Executive Member',
        grade: '',
        lists: ['newsletter'],
        active: true,
        createdAt: new Date().toISOString()
      });

      alert("Registration successful! Welcome to the Executive Portal.");
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setIsSigningUp(false);
    } catch (err) {
      console.error(err);
      setAuthError(err.message || "Failed to register.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // -------------------------------------------------------------
  // RENDERS
  // -------------------------------------------------------------
  if (!authInitialized) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Initializing portal...</p>
        </section>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <div id="lock-screen" className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3.5rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', border: '2px solid #2563eb', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #93c5fd 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem', fontWeight: 800 }}>
                Executive Portal
              </h1>

              {!isSigningUp ? (
                <>
                  <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
                    Access restricted to current UCDS Executives. Sign in using your registered email and password.
                  </p>

                  <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Email Address</label>
                      <input 
                        type="email" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="exec@ucds.ca" 
                        className="exec-input" 
                        style={{ width: '100%', padding: '0.8rem 1.2rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '999px', color: '#ffffff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                        required 
                      />
                    </div>
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Password</label>
                      <input 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="exec-input" 
                        style={{ width: '100%', padding: '0.8rem 1.2rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '999px', color: '#ffffff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                        required 
                      />
                    </div>
                    
                    <button type="submit" disabled={authLoading} className="exec-btn exec-btn-primary" style={{ display: 'inline-flex', padding: '0.9rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                      {authLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    
                    {authError && (
                      <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        ❌ {authError}
                      </div>
                    )}

                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '1.5rem' }}>
                      Need an account? <span onClick={() => { setIsSigningUp(true); setAuthError(''); }} style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</span>
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
                    Register a new executive account. Signup is only allowed if your email has been authorized.
                  </p>

                  <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Full Name</label>
                      <input 
                        type="text" 
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe" 
                        className="exec-input" 
                        style={{ width: '100%', padding: '0.8rem 1.2rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '999px', color: '#ffffff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                        required 
                      />
                    </div>
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Email Address</label>
                      <input 
                        type="email" 
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="exec@ucds.ca" 
                        className="exec-input" 
                        style={{ width: '100%', padding: '0.8rem 1.2rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '999px', color: '#ffffff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                        required 
                      />
                    </div>
                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Password</label>
                      <input 
                        type="password" 
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="exec-input" 
                        style={{ width: '100%', padding: '0.8rem 1.2rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '999px', color: '#ffffff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                        required 
                      />
                    </div>
                    
                    <button type="submit" disabled={authLoading} className="exec-btn exec-btn-primary" style={{ display: 'inline-flex', padding: '0.9rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                      {authLoading ? 'Registering...' : 'Register'}
                    </button>
                    
                    {authError && (
                      <div style={{ color: '#ef4444', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        ❌ {authError}
                      </div>
                    )}

                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '1.5rem' }}>
                      Already have an account? <span onClick={() => { setIsSigningUp(false); setAuthError(''); }} style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</span>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const getTabMetrics = (tabId) => {
    switch (tabId) {
      case 'ledger':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Entries</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ffffff' }}>{ledgerCount}</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '180px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Net Balance</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        );
      case 'roster':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Active Officers</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{executivesCount}</div>
            </div>
          </div>
        );
      case 'email':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Subscribers</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6' }}>{subscribersCount}</div>
            </div>
          </div>
        );
      case 'blog':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Published Posts</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6' }}>{postsCount}</div>
            </div>
          </div>
        );
      case 'access':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Authorized Emails</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0d9488' }}>{allowedCount}</div>
            </div>
          </div>
        );
      case 'socials':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Instagram Posts</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ec4899' }}>{instagramPostsCount}</div>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Scheduled Events</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0ea5e9' }}>{eventsCount}</div>
            </div>
          </div>
        );
      case 'tournaments':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Tournaments</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#a855f7' }}>{tournamentsCount}</div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '180px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>System Status</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>Operational</div>
              </div>
            </div>
          </div>
        );
      case 'membership':
        return (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Active Members</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#34d399' }}>{membersCount}</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: '10px', minWidth: '150px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>UCDS Alumni</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#a78bfa' }}>{alumniCount}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const activeTheme = PANEL_THEMES[activeTab];

  return (
    <main>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tab-panel-animate {
          animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tab-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <section className="section">
        <div className="container">
          
          <div id="exec-dashboard" className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1200px', margin: '4rem auto', textAlign: 'left' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Executive Dashboard</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Logged in as: <strong style={{ color: '#60a5fa' }}>{currentUser?.email}</strong></p>
              </div>
              <button onClick={handleLogout} className="exec-btn exec-btn-danger" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#dc2626', color: '#ffffff' }}>Log Out</button>
            </div>

            {/* Dashboard tabs header */}
            <h3 style={{ color: '#ffffff', marginBottom: '1.25rem' }}>Executive Tools</h3>
            
            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem' }}>
              {Object.values(PANEL_THEMES).map((theme) => {
                const isActive = activeTab === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTab(theme.id)}
                    className="tab-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isActive ? theme.borderColor : 'rgba(255, 255, 255, 0.08)',
                      background: isActive ? theme.bgColor : 'transparent',
                      color: isActive ? theme.color : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: isActive ? `0 4px 12px ${theme.shadowColor}` : 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: isActive ? theme.color : '#94a3b8' }}>
                      {theme.icon}
                    </span>
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel Card */}
            {metricsLoading ? (
              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', padding: '2rem 0' }}>Loading dashboard statistics...</p>
            ) : (
              <div 
                key={activeTab} // Unique key fires animation on change
                className="tab-panel-animate"
                style={{
                  background: activeTheme.bgColor,
                  border: `1px solid ${activeTheme.borderColor}`,
                  borderRadius: '16px',
                  padding: '2.5rem',
                  boxShadow: `0 8px 30px ${activeTheme.shadowColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Subtle corner colored glow */}
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: activeTheme.color,
                  filter: 'blur(50px)',
                  opacity: 0.12,
                  pointerEvents: 'none'
                }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: activeTheme.color
                      }}>
                        {activeTheme.icon}
                      </span>
                      <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, color: '#ffffff' }}>
                        {activeTheme.label}
                      </h2>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: 0, lineHeight: '1.6', maxWidth: '750px' }}>
                      {activeTheme.id === 'ledger' && "Track club transactions, record deposits/withdrawals, and review balances."}
                      {activeTheme.id === 'roster' && "Update profiles, roles, and profile pictures shown on the Connect page."}
                      {activeTheme.id === 'email' && "Create newsletter drafts, schedule mail dispatches, and check subscribers."}
                      {activeTheme.id === 'blog' && "Write, edit, and publish posts shown on the dynamic club blog page."}
                      {activeTheme.id === 'access' && "Authorize signup emails to permit new executives to create accounts."}
                      {activeTheme.id === 'socials' && "Manage dynamic Instagram post cards displayed natively to the socials feed."}
                      {activeTheme.id === 'calendar' && "Schedule, edit, and organize society seminars, debate opens, socials, and executive board meetings."}
                      {activeTheme.id === 'membership' && "Review member profiles, verify payments, approve fee waivers, and manage UCDS alumni."}
                      {activeTheme.id === 'tournaments' && "Create, edit, and configure debate tournaments with automatic form generation, schedules, and custom settings."}
                      {activeTheme.id === 'system' && "Initialize Cloud Firestore collection tables with default mock databases."}
                    </p>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }}></div>

                <div>
                  <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem', fontWeight: 700 }}>
                    Live Metrics
                  </h4>
                  {getTabMetrics(activeTab)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Link 
                    to={activeTheme.path} 
                    className="exec-btn"
                    style={{
                      textDecoration: 'none',
                      padding: '0.8rem 2rem',
                      fontSize: '0.95rem',
                      borderRadius: '999px',
                      background: activeTheme.btnBg,
                      color: '#ffffff',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: `0 4px 12px ${activeTheme.shadowColor}`,
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = activeTheme.btnHoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = activeTheme.btnBg; e.currentTarget.style.transform = 'none'; }}
                  >
                    <span>Go to {activeTheme.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

          </div>
          
        </div>
      </section>
    </main>
  );
}
