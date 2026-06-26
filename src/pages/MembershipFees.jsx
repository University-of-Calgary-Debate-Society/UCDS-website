import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useDialog } from '../context/DialogContext';

export default function MembershipFees() {
  const location = useLocation();
  const navigate = useNavigate();
  const { alert } = useDialog();

  const [memberId, setMemberId] = useState(location.state?.memberId || '');
  const [emailLookup, setEmailLookup] = useState(location.state?.email || '');
  const [memberData, setMemberData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('etransfer');

  // Stripe Sim State
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [stripeProcessing, setStripeProcessing] = useState(false);

  // E-Transfer State
  const [eTransferRef, setETransferRef] = useState('');
  const [submittingETransfer, setSubmittingETransfer] = useState(false);

  // Waiver State
  const [waiverReason, setWaiverReason] = useState('');
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const fetchMember = async (id) => {
    setSearching(true);
    try {
      const docRef = doc(db, 'members', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMemberData({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert("Registration record not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading member data.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchMember(memberId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!emailLookup.trim()) return;
    setSearching(true);
    try {
      const qEmail = emailLookup.trim().toLowerCase();
      const colRef = collection(db, 'members');
      const snapshot = await getDocs(colRef);
      const found = snapshot.docs.find(doc => {
        const d = doc.data();
        return (d.email?.toLowerCase() === qEmail || d.ucalgaryEmail?.toLowerCase() === qEmail);
      });

      if (found) {
        setMemberId(found.id);
        setMemberData({ id: found.id, ...found.data() });
      } else {
        alert("No membership registration found with that email. Please sign up first.");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching database: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleStripePayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !cardZip) {
      alert("Please fill in all card details.");
      return;
    }
    setStripeProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const stripeRef = `STRIPE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 1. Update member document in members collection
      const docRef = doc(db, 'members', memberData.id);
      await updateDoc(docRef, {
        fees_paid: true,
        payment_method: 'Stripe',
        payment_reference: stripeRef,
        fee_waiver_requested: false,
        fee_waiver_reason: ''
      });

      // Synchronize with subscribers mailing list
      if (memberData.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', memberData.subscriberId);
          await updateDoc(subRef, {
            fees_paid: true
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }

      // 2. Fetch and append to ledger collection
      const ledgerCol = collection(db, 'ledger');
      const snapshot = await getDocs(ledgerCol);
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedTxs = [...txs].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        if (a.index !== undefined && b.index !== undefined) {
          return a.index - b.index;
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      const latestTx = sortedTxs.length > 0 ? sortedTxs[sortedTxs.length - 1] : null;
      const prevBalance = latestTx ? latestTx.balance || 0 : 0;
      const nextIndex = latestTx ? (latestTx.index || sortedTxs.length) + 1 : 1;
      const amount = 20.00;
      const calculatedBalance = prevBalance + amount;
      const memberFullName = memberData.fullName || `${memberData.firstName} ${memberData.lastName}`;

      await addDoc(ledgerCol, {
        date: new Date().toISOString().split('T')[0],
        method: 'Stripe',
        details: `Membership Fee - ${memberFullName}`,
        description: `Membership Fee - ${memberFullName}`,
        reference: `STRIPE-SIM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        sender: memberFullName,
        recipient: 'The University of Calgary Debate Society',
        deposit: amount,
        withdrawal: null,
        balance: calculatedBalance,
        index: nextIndex,
        createdAt: new Date().toISOString()
      });

      alert("Payment successful! Your membership has been activated.");
      setShowStripeModal(false);
      fetchMember(memberData.id);
    } catch (err) {
      console.error(err);
      alert("Payment confirmation failed: " + err.message);
    } finally {
      setStripeProcessing(false);
    }
  };

  const handleETransferSubmit = async (e) => {
    e.preventDefault();
    if (!eTransferRef.trim()) {
      alert("Please enter a valid reference number.");
      return;
    }
    setSubmittingETransfer(true);
    try {
      const docRef = doc(db, 'members', memberData.id);
      await updateDoc(docRef, {
        payment_method: 'E-Transfer',
        payment_reference: eTransferRef.trim(),
        fees_paid: false,
        fee_waiver_requested: false,
        fee_waiver_reason: ''
      });

      // Synchronize with subscribers mailing list
      if (memberData.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', memberData.subscriberId);
          await updateDoc(subRef, {
            fees_paid: false
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }

      alert("E-Transfer logged successfully! An executive will verify the receipt soon.");
      setETransferRef('');
      fetchMember(memberData.id);
    } catch (err) {
      console.error(err);
      alert("Failed to submit E-Transfer: " + err.message);
    } finally {
      setSubmittingETransfer(false);
    }
  };

  const handleWaiverSubmit = async (e) => {
    e.preventDefault();
    if (!waiverReason.trim()) {
      alert("Please fill out the reason questionnaire.");
      return;
    }
    setSubmittingWaiver(true);
    try {
      const docRef = doc(db, 'members', memberData.id);
      await updateDoc(docRef, {
        payment_method: 'Waiver',
        fee_waiver_requested: true,
        fee_waiver_reason: waiverReason.trim(),
        fees_paid: false
      });

      // Synchronize with subscribers mailing list
      if (memberData.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', memberData.subscriberId);
          await updateDoc(subRef, {
            fees_paid: false
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }

      alert("Your waiver request has been submitted. The executive committee will review it, and we will contact you directly.");
      setWaiverReason('');
      fetchMember(memberData.id);
    } catch (err) {
      console.error(err);
      alert("Failed to submit fee waiver: " + err.message);
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const handleETransferDone = async () => {
    try {
      const docRef = doc(db, 'members', memberData.id);
      await updateDoc(docRef, {
        payment_method: 'E-Transfer',
        fees_paid: false
      });
      // Sync with subscribers
      if (memberData.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', memberData.subscriberId);
          await updateDoc(subRef, {
            fees_paid: false
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }
    } catch (err) {
      console.error(err);
    }
    navigate('/');
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ background: '#0b1a3a', padding: '4rem 0', flex: 1 }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              Complete Registration
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>
              Finalize your UCDS Membership dues. We accept Stripe, E-Transfer, or Fee Waiver requests.
            </p>
          </div>

          {!memberData ? (
            <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '3rem', borderRadius: '1.25rem', textAlign: 'center' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '1.5rem' }}>Lookup Your Application</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>If you have already signed up, enter your email address to select a payment option.</p>
              
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
                <input 
                  type="email"
                  placeholder="email@example.com"
                  value={emailLookup}
                  onChange={e => setEmailLookup(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.8rem 1.2rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  required
                />
                <button 
                  type="submit"
                  disabled={searching}
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {searching ? 'Loading...' : 'Find App'}
                </button>
              </form>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/membership-sign-up" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Back to Sign Up Form</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Member Profile Summary */}
              <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2rem', borderRadius: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffffff', fontSize: '1.5rem', fontWeight: 800 }}>
                      Applicant: {memberData.firstName} {memberData.lastName}
                    </h3>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Preferred Email: <strong style={{ color: '#60a5fa' }}>{memberData.email}</strong></p>
                    <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>UCalgary Email: <strong style={{ color: '#60a5fa' }}>{memberData.ucalgaryEmail}</strong></p>
                    <p style={{ margin: '0.25rem 0 0', color: '#94a3b8' }}>UCID: <strong style={{ color: '#60a5fa' }}>{memberData.ucid}</strong></p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '999px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      background: memberData.fees_paid 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : memberData.payment_method === 'Waiver'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : memberData.payment_method === 'E-Transfer'
                            ? 'rgba(14, 165, 233, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                      color: memberData.fees_paid 
                        ? '#10b981' 
                        : memberData.payment_method === 'Waiver'
                          ? '#f59e0b'
                          : memberData.payment_method === 'E-Transfer'
                            ? '#0ea5e9'
                            : '#ef4444',
                      border: `1px solid ${
                        memberData.fees_paid 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : memberData.payment_method === 'Waiver'
                            ? 'rgba(245, 158, 11, 0.3)'
                            : memberData.payment_method === 'E-Transfer'
                              ? 'rgba(14, 165, 233, 0.3)'
                              : 'rgba(239, 68, 68, 0.3)'
                      }`
                    }}>
                      Status: {memberData.fees_paid 
                        ? 'Active Member (Paid)' 
                        : memberData.payment_method === 'Waiver'
                          ? 'Waiver Requested (Pending Review)'
                          : memberData.payment_method === 'E-Transfer'
                            ? 'E-Transfer Submitted (Pending Review)'
                            : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              {memberData.fees_paid ? (
                <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3rem', borderRadius: '1.25rem', textAlign: 'center' }}>
                  <h3 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.8rem' }}>🎉 Welcome to UCDS!</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Your general membership fee is fully paid and confirmed. You are officially an active general member in good standing of the University of Calgary Debate Society!
                  </p>
                  <Link to="/" className="exec-btn" style={{ textDecoration: 'none', background: '#3b82f6', color: '#ffffff', padding: '0.8rem 2rem', borderRadius: '999px', fontWeight: 700 }}>
                    Return to Homepage
                  </Link>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(17, 40, 84, 0.45)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '1.25rem',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  {/* Selector Tabs */}
                  <div className="payment-tabs" style={{
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('etransfer')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: activeTab === 'etransfer' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: activeTab === 'etransfer' ? '1px solid #3b82f6' : 'none',
                        color: activeTab === 'etransfer' ? '#60a5fa' : '#cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        boxShadow: activeTab === 'etransfer' ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💸 Interac E-Transfer
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('stripe')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: activeTab === 'stripe' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        border: activeTab === 'stripe' ? '1px solid rgba(99, 102, 241, 0.3)' : 'none',
                        color: activeTab === 'stripe' ? '#818cf8' : '#94a3b8',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💳 Card (Coming Soon)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('waiver')}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: activeTab === 'waiver' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        border: activeTab === 'waiver' ? '1px solid #f59e0b' : 'none',
                        color: activeTab === 'waiver' ? '#fbbf24' : '#94a3b8',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        boxShadow: activeTab === 'waiver' ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🙋 Request Fee Waiver
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div style={{ marginTop: '0.5rem' }}>
                    {activeTab === 'etransfer' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>💸 Option 1: Interac E-Transfer</h4>
                        
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderLeft: '4px solid #22c55e',
                          padding: '1.25rem',
                          borderRadius: '8px',
                          color: '#a7f3d0',
                          fontSize: '1rem',
                          lineHeight: 1.6
                        }}>
                          Please send <strong>$20.00</strong> to <strong>finance@ucds.ca</strong>. We will manually check if you have paid and then update your membership status!
                        </div>

                        <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: 0, fontSize: '0.95rem' }}>
                          Your registration details are saved in our database. Once we verify the bank transaction, your membership will be marked active.
                        </p>

                        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                          <button 
                            type="button"
                            onClick={handleETransferDone}
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '0.8rem 2.5rem',
                              fontSize: '1rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textAlign: 'center',
                              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                              transition: 'all 0.2s'
                            }}
                          >
                            Done / Return Home
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'stripe' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '2rem 1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
                        <h4 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Card Payments (Coming Soon)</h4>
                        <p style={{ color: '#cbd5e1', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6', fontSize: '0.95rem' }}>
                          Direct credit and debit card payments via Stripe are currently under maintenance and will be available soon. Please use **Interac E-Transfer** or request a **Fee Waiver** in the meantime.
                        </p>
                      </div>
                    )}

                    {activeTab === 'waiver' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>🙋 Option 2: Request Fee Waiver</h4>
                        <p style={{ color: '#cbd5e1', margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                          Debaters in financial situations that prevent them from paying fees are eligible to have their registration fee and other associated costs subsidized. Please fill out the details below:
                        </p>
                        
                        <form onSubmit={handleWaiverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label htmlFor="waiverReason" style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Why are you choosing this option?</label>
                            <textarea 
                              id="waiverReason"
                              rows="3"
                              placeholder="Please provide details (financial hardship, student budget constraints, etc.) so we can review your waiver request."
                              value={waiverReason}
                              onChange={e => setWaiverReason(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.8rem 1.2rem',
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical'
                              }}
                              required
                            />
                          </div>
                          <button 
                            type="submit"
                            disabled={submittingWaiver}
                            style={{
                              alignSelf: 'flex-start',
                              background: '#f59e0b',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '0.8rem 2rem',
                              fontSize: '1rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            {submittingWaiver ? 'Submitting...' : 'Submit Waiver Request'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Stripe Modal Overlay */}
      {showStripeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(10, 25, 47, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #4f46e5',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { if (!stripeProcessing) setShowStripeModal(false); }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.2rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.5rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', background: 'rgba(79, 70, 229, 0.1)', color: '#818cf8', padding: '0.75rem', borderRadius: '1rem', marginBottom: '1rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '32px', height: '32px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 style={{ color: '#ffffff', margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>Stripe Secure Checkout</h3>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Paying <strong>$20.00 CAD</strong> to University of Calgary Debate Society</p>
            </div>

            {stripeProcessing ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '4px solid rgba(99, 102, 241, 0.1)',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1.5rem'
                }}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <h4 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Processing Payment...</h4>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Do not refresh or close this modal</p>
              </div>
            ) : (
              <form onSubmit={handleStripePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="cardNo" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Card Number</label>
                  <input 
                    type="text" 
                    id="cardNo"
                    placeholder="4242 •••• •••• 4242"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1.2rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label htmlFor="cardExp" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Expiry Date</label>
                    <input 
                      type="text" 
                      id="cardExp"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1.2rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label htmlFor="cardCvc" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>CVC</label>
                    <input 
                      type="text" 
                      id="cardCvc"
                      placeholder="123"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1.2rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="cardZip" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Postal / ZIP Code</label>
                  <input 
                    type="text" 
                    id="cardZip"
                    placeholder="T2N 1N4"
                    value={cardZip}
                    onChange={e => setCardZip(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1.2rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    required 
                  />
                </div>

                <button 
                  type="submit"
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  Pay $20.00 CAD
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
