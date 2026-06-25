import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function AccessControlManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Access Control State
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newAllowedEmail, setNewAllowedEmail] = useState('');
  const [emailsLoading, setEmailsLoading] = useState(true);

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
  // FETCH AUTHORIZED EMAILS
  // -------------------------------------------------------------
  const fetchAllowedEmails = async () => {
    setEmailsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'allowed_emails'));
      setAllowedEmails(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching allowed emails", err);
    } finally {
      setEmailsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllowedEmails();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------
  const handleAddAllowedEmail = async (e) => {
    e.preventDefault();
    const emailToAdd = newAllowedEmail.trim().toLowerCase();
    if (!emailToAdd || !emailToAdd.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }

    if (allowedEmails.some(a => a.email === emailToAdd)) {
      alert("Email is already on the allowed list.");
      return;
    }

    try {
      await addDoc(collection(db, 'allowed_emails'), {
        email: emailToAdd,
        addedAt: new Date().toISOString()
      });
      setNewAllowedEmail('');
      fetchAllowedEmails();
      alert("Email successfully added to allowed list!");
    } catch (err) {
      console.error(err);
      alert("Failed to add allowed email: " + err.message);
    }
  };

  const handleRemoveAllowedEmail = async (id, email) => {
    if (!await confirm(`Are you sure you want to remove ${email} from the allowed list?`)) return;
    try {
      await deleteDoc(doc(db, 'allowed_emails', id));
      fetchAllowedEmails();
      alert("Email removed from allowed list.");
    } catch (err) {
      console.error(err);
      alert("Failed to remove email: " + err.message);
    }
  };

  if (!authInitialized || !isLoggedIn) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Redirecting to portal...</p>
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
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Access Control Manager</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Authorize email addresses to register executive accounts on the site.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
              {/* Left Column: Add Form */}
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Authorize New Email</h4>
                <form onSubmit={handleAddAllowedEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={newAllowedEmail} 
                      onChange={(e) => setNewAllowedEmail(e.target.value)} 
                      className="text-input" 
                      placeholder="newexec@ucds.ca" 
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} 
                      required 
                    />
                  </div>
                  <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '10px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                    Add to Allowed List
                  </button>
                </form>
              </div>

              {/* Right Column: Allowed list table */}
              <div>
                <h4 style={{ margin: '0 0 1rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Authorized Emails ({allowedEmails.length})</h4>
                <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  {emailsLoading ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading authorized emails...</p>
                  ) : allowedEmails.length === 0 ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No authorized emails. Please add an email above.</p>
                  ) : (
                    <table className="exec-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#ffffff' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.45)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '12px 10px' }}>Email Address</th>
                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allowedEmails.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '10px', color: '#ffffff', fontWeight: '500' }}>{item.email}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleRemoveAllowedEmail(item.id, item.email)} 
                                className="exec-btn exec-btn-danger" 
                                style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '4px', background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
