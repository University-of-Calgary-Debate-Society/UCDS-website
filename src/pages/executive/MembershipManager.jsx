import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function MembershipManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Members list
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlumni, setFilterAlumni] = useState('all'); // 'all', 'active', 'alumni'
  const [filterPayment, setFilterPayment] = useState('all'); // 'all', 'paid', 'unpaid', 'etrans_pending', 'waiver_pending'

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // Member Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [ucalgaryEmail, setUcalgaryEmail] = useState('');
  const [ucid, setUcid] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [feesPaid, setFeesPaid] = useState(false);
  const [alumni, setAlumni] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [feeWaiverRequested, setFeeWaiverRequested] = useState(false);
  const [feeWaiverReason, setFeeWaiverReason] = useState('');

  // Interests check
  const [interests, setInterests] = useState({
    debater: false,
    judge: false,
    volunteer: false,
    chill: false
  });

  // Waiver View Modal
  const [viewWaiverMember, setViewWaiverMember] = useState(null);

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
  // FETCH MEMBERS
  // -------------------------------------------------------------
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'members'));
      const snapshot = await getDocs(q);
      const allMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(allMembers);
    } catch (err) {
      console.error("Error fetching members", err);
      alert("Failed to load members roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // MUTATIONS / SAVE RECORD
  // -------------------------------------------------------------
  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setSelectedMemberId('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setUcalgaryEmail('');
    setUcid('');
    setProgram('');
    setYear('');
    setFeesPaid(true); // Default to true when manually adding
    setAlumni(false);
    setPaymentMethod('Cash / Manual');
    setPaymentReference('MANUAL-ADD-' + Math.random().toString(36).substring(2, 7).toUpperCase());
    setFeeWaiverRequested(false);
    setFeeWaiverReason('');
    setInterests({ debater: false, judge: false, volunteer: false, chill: false });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (member) => {
    setIsEditMode(true);
    setSelectedMemberId(member.id);
    setFirstName(member.firstName || '');
    setLastName(member.lastName || '');
    setEmail(member.email || '');
    setUcalgaryEmail(member.ucalgaryEmail || '');
    setUcid(member.ucid || '');
    setProgram(member.program || '');
    setYear(member.grade || '');
    setFeesPaid(!!member.fees_paid);
    setAlumni(!!member.alumni);
    setPaymentMethod(member.payment_method || '');
    setPaymentReference(member.payment_reference || '');
    setFeeWaiverRequested(!!member.fee_waiver_requested);
    setFeeWaiverReason(member.fee_waiver_reason || '');
    setInterests({
      debater: !!member.debater,
      judge: !!member.judge,
      volunteer: !!member.volunteer,
      chill: !!member.chilling
    });
    setIsFormOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert("First name, last name, and preferred email are required.");
      return;
    }

    if (!ucid.trim()) {
      alert("UCID is required.");
      return;
    }
    const ucidRegex = /^\d+$/;
    if (!ucidRegex.test(ucid.trim()) || ucid.trim().length < 8) {
      alert("UCID must contain only numbers and be at least 8 digits long.");
      return;
    }

    try {
      if (isEditMode) {
        const memberRef = doc(db, 'members', selectedMemberId);
        const memberSnap = await getDoc(memberRef);
        let subId = null;
        if (memberSnap.exists()) {
          subId = memberSnap.data().subscriberId;
        }

        const memberPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          ucalgaryEmail: ucalgaryEmail.trim().toLowerCase(),
          ucid: ucid.trim(),
          program: program.trim(),
          grade: year,
          fees_paid: feesPaid,
          alumni: alumni,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          fee_waiver_requested: feeWaiverRequested,
          fee_waiver_reason: feeWaiverReason,
          debater: interests.debater,
          judge: interests.judge,
          volunteer: interests.volunteer,
          chilling: interests.chill,
          updatedAt: new Date().toISOString()
        };

        await updateDoc(memberRef, memberPayload);

        const subPayload = {
          email: email.trim().toLowerCase(),
          ucalgaryEmail: ucalgaryEmail.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          grade: year,
          fees_paid: feesPaid,
          alumni: alumni,
          updatedAt: new Date().toISOString()
        };

        if (subId) {
          try {
            await updateDoc(doc(db, 'subscribers', subId), subPayload);
          } catch (subErr) {
            console.error("Failed to update subscriber doc", subErr);
          }
        } else {
          // Search by email to find a subscriber, or create one
          const qPref = query(collection(db, 'subscribers'), where('email', '==', email.trim().toLowerCase()));
          const snap = await getDocs(qPref);
          if (!snap.empty) {
            const foundSubId = snap.docs[0].id;
            await updateDoc(doc(db, 'subscribers', foundSubId), subPayload);
            await updateDoc(memberRef, { subscriberId: foundSubId });
          } else {
            const newSub = {
              ...subPayload,
              listType: 'ucds_members',
              lists: ['newsletter'],
              active: true,
              institution: 'University of Calgary',
              club: 'The University of Calgary Debate Society',
              city: 'Calgary',
              region: 'Alberta',
              country: 'Canada',
              createdAt: new Date().toISOString()
            };
            const addedSub = await addDoc(collection(db, 'subscribers'), newSub);
            await updateDoc(memberRef, { subscriberId: addedSub.id });
          }
        }

        alert("Member details updated successfully.");
      } else {
        // Create in subscribers collection first
        const subPayload = {
          email: email.trim().toLowerCase(),
          ucalgaryEmail: ucalgaryEmail.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          listType: 'ucds_members',
          lists: ['newsletter'],
          active: true,
          grade: year,
          fees_paid: feesPaid,
          alumni: alumni,
          institution: 'University of Calgary',
          club: 'The University of Calgary Debate Society',
          city: 'Calgary',
          region: 'Alberta',
          country: 'Canada',
          createdAt: new Date().toISOString()
        };
        const subDocRef = await addDoc(collection(db, 'subscribers'), subPayload);

        // Create in members collection
        const memberPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          ucalgaryEmail: ucalgaryEmail.trim().toLowerCase(),
          ucid: ucid.trim(),
          program: program.trim(),
          grade: year,
          fees_paid: feesPaid,
          alumni: alumni,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          fee_waiver_requested: feeWaiverRequested,
          fee_waiver_reason: feeWaiverReason,
          debater: interests.debater,
          judge: interests.judge,
          volunteer: interests.volunteer,
          chilling: interests.chill,
          subscriberId: subDocRef.id,
          institution: 'University of Calgary',
          club: 'The University of Calgary Debate Society',
          city: 'Calgary',
          region: 'Alberta',
          country: 'Canada',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'members'), memberPayload);

        alert("New member added successfully.");
      }
      setIsFormOpen(false);
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Error saving member details: " + err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    const doubleCheck = await confirm("Are you sure you want to permanently delete this member registration? This cannot be undone.");
    if (!doubleCheck) return;

    try {
      const memberRef = doc(db, 'members', id);
      const memberSnap = await getDoc(memberRef);
      let subId = null;
      let memberEmail = '';
      if (memberSnap.exists()) {
        const d = memberSnap.data();
        subId = d.subscriberId;
        memberEmail = d.email;
      }

      await deleteDoc(memberRef);

      if (subId) {
        try {
          await deleteDoc(doc(db, 'subscribers', subId));
        } catch (subErr) {
          console.error("Failed to delete subscriber", subErr);
        }
      } else if (memberEmail) {
        const qEmail = query(collection(db, 'subscribers'), where('email', '==', memberEmail.toLowerCase()));
        const snap = await getDocs(qEmail);
        if (!snap.empty) {
          await deleteDoc(doc(db, 'subscribers', snap.docs[0].id));
        }
      }

      alert("Member deleted successfully.");
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Error deleting member: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // APPROVE PAYMENTS & WAIVERS (WITH LEDGER SYNC)
  // -------------------------------------------------------------
  const handleVerifyPayment = async (member, isWaiver = false) => {
    const confirmationMsg = isWaiver 
      ? `Are you sure you want to approve this fee waiver? The member will be marked as paid, but no ledger balance deposit will be logged.`
      : `Verify and confirm payment of $20.00 for ${member.firstName} ${member.lastName}? This will record a deposit in the financial ledger.`;
    
    const goAhead = await confirm(confirmationMsg);
    if (!goAhead) return;

    try {
      // 1. Update member in members collection
      const docRef = doc(db, 'members', member.id);
      await updateDoc(docRef, {
        fees_paid: true,
        fee_waiver_requested: false,
        payment_method: isWaiver ? 'Waiver' : member.payment_method || 'E-Transfer'
      });

      // Synchronize with subscribers collection
      if (member.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', member.subscriberId);
          await updateDoc(subRef, {
            fees_paid: true
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      } else if (member.email) {
        try {
          const qPref = query(collection(db, 'subscribers'), where('email', '==', member.email.toLowerCase()));
          const snap = await getDocs(qPref);
          if (!snap.empty) {
            await updateDoc(doc(db, 'subscribers', snap.docs[0].id), { fees_paid: true });
          }
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }

      // 2. If it is NOT a waiver (i.e. E-Transfer payment), create a Ledger deposit line
      if (!isWaiver) {
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
        const memberFullName = member.fullName || `${member.firstName} ${member.lastName}`;

        await addDoc(ledgerCol, {
          date: new Date().toISOString().split('T')[0],
          method: member.payment_method || 'E-Transfer',
          details: `Membership Fee - ${memberFullName}`,
          description: `Membership Fee - ${memberFullName}`,
          reference: member.payment_reference || `MANUAL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          sender: memberFullName,
          recipient: 'The University of Calgary Debate Society',
          deposit: amount,
          withdrawal: null,
          balance: calculatedBalance,
          index: nextIndex,
          createdAt: new Date().toISOString()
        });
      }

      alert(isWaiver ? "Fee waiver approved successfully." : "Payment confirmed and logged to Financial Ledger!");
      setViewWaiverMember(null);
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Verification failed: " + err.message);
    }
  };

  const handleDenyWaiver = async (member) => {
    const confirmDeny = await confirm(`Reject the fee waiver request for ${member.firstName} ${member.lastName}?`);
    if (!confirmDeny) return;

    try {
      const docRef = doc(db, 'members', member.id);
      await updateDoc(docRef, {
        fee_waiver_requested: false,
        fee_waiver_reason: '',
        payment_method: ''
      });

      // Synchronize with subscribers collection
      if (member.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', member.subscriberId);
          await updateDoc(subRef, {
            fees_paid: false
          });
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      } else if (member.email) {
        try {
          const qPref = query(collection(db, 'subscribers'), where('email', '==', member.email.toLowerCase()));
          const snap = await getDocs(qPref);
          if (!snap.empty) {
            await updateDoc(doc(db, 'subscribers', snap.docs[0].id), { fees_paid: false });
          }
        } catch (subErr) {
          console.error("Mailing list sync warning", subErr);
        }
      }

      alert("Waiver request rejected.");
      setViewWaiverMember(null);
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Action failed: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search query matching Name, Email, UCID
    if (searchTerm.trim()) {
      const queryStr = searchTerm.trim().toLowerCase();
      result = result.filter(m => 
        (m.firstName || '').toLowerCase().includes(queryStr) ||
        (m.lastName || '').toLowerCase().includes(queryStr) ||
        (m.fullName || '').toLowerCase().includes(queryStr) ||
        (m.email || '').toLowerCase().includes(queryStr) ||
        (m.ucalgaryEmail || '').toLowerCase().includes(queryStr) ||
        (m.ucid || '').toLowerCase().includes(queryStr)
      );
    }

    // Alumni status filter
    if (filterAlumni === 'active') {
      result = result.filter(m => !m.alumni);
    } else if (filterAlumni === 'alumni') {
      result = result.filter(m => m.alumni);
    }

    // Payment status filter
    if (filterPayment === 'paid') {
      result = result.filter(m => m.fees_paid);
    } else if (filterPayment === 'unpaid') {
      result = result.filter(m => !m.fees_paid && !m.fee_waiver_requested && m.payment_method !== 'E-Transfer');
    } else if (filterPayment === 'etrans_pending') {
      result = result.filter(m => !m.fees_paid && m.payment_method === 'E-Transfer');
    } else if (filterPayment === 'waiver_pending') {
      result = result.filter(m => !m.fees_paid && m.fee_waiver_requested);
    }

    return result;
  }, [members, searchTerm, filterAlumni, filterPayment]);

  return (
    <main style={{ minHeight: '90vh' }}>
      <section className="section" style={{ background: '#0b1a3a', padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <Link to="/executive" style={{ color: '#60a5fa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                ← Executive Portal
              </Link>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Membership Manager
              </h1>
              <p style={{ color: '#cbd5e1', margin: '0.25rem 0 0' }}>
                Review active members, alumni records, verify e-transfers, and assess fee waivers.
              </p>
            </div>
            <button 
              onClick={handleOpenAddForm}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '0.8rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              Add Member Manually
            </button>
          </div>

          {/* Filters Bar */}
          <div style={{
            background: 'rgba(17, 40, 84, 0.45)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Search Members</label>
              <input 
                type="text"
                placeholder="Search name, email, UCID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Alumni Filter</label>
              <select
                value={filterAlumni}
                onChange={e => setFilterAlumni(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">All Members</option>
                <option value="active">Active Members Only</option>
                <option value="alumni">Alumni Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Payment / Waiver Filter</label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid / Active</option>
                <option value="unpaid">Unpaid (No Log)</option>
                <option value="etrans_pending">E-Transfer Pending Review</option>
                <option value="waiver_pending">Fee Waiver Requested</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#cbd5e1' }}>Loading members roster...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '4rem', borderRadius: '1.25rem', textAlign: 'center' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>No Members Found</h3>
              <p style={{ color: '#cbd5e1', margin: 0 }}>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '1.25rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', textAlign: 'left', minWidth: '1000px', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Emails & UCID</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Year / Program</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Interests</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Alumni Status</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700 }}>Payment Dues</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                      
                      {/* Name */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{member.firstName} {member.lastName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Added: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </td>

                      {/* Emails / UCID */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem' }}>Pref: <span style={{ color: '#60a5fa' }}>{member.email}</span></div>
                        <div style={{ fontSize: '0.85rem' }}>UCal: <span style={{ color: '#60a5fa' }}>{member.ucalgaryEmail}</span></div>
                        <div style={{ fontSize: '0.85rem' }}>UCID: <span>{member.ucid}</span></div>
                      </td>

                      {/* Grade / Program */}
                      <td style={{ padding: '0.75rem' }}>
                        <div>Year {member.grade || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{member.program || 'No program specified'}</div>
                      </td>

                      {/* Interests */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {member.debater && <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Debate</span>}
                          {member.judge && <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Judge</span>}
                          {member.volunteer && <span style={{ fontSize: '0.75rem', background: '#ec4899', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Volun</span>}
                          {member.chilling && <span style={{ fontSize: '0.75rem', background: '#8b5cf6', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Chill</span>}
                          {!member.debater && !member.judge && !member.volunteer && !member.chilling && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>}
                        </div>
                      </td>

                      {/* Alumni Status */}
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: member.alumni ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: member.alumni ? '#a78bfa' : '#34d399'
                        }}>
                          {member.alumni ? 'Alumni' : 'Active Member'}
                        </span>
                      </td>

                      {/* Payment Dues */}
                      <td style={{ padding: '0.75rem' }}>
                        {member.fees_paid ? (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Paid (${member.payment_method || 'Stripe'})</span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden' }}>Ref: {member.payment_reference || 'N/A'}</div>
                          </div>
                        ) : member.fee_waiver_requested ? (
                          <div>
                            <button 
                              onClick={() => setViewWaiverMember(member)}
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: '4px',
                                color: '#fbbf24',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              ⚠ Review Waiver
                            </button>
                          </div>
                        ) : member.payment_method === 'E-Transfer' ? (
                          <div>
                            <div style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>E-Transfer Pending</div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Ref: {member.payment_reference}</div>
                            <button 
                              onClick={() => handleVerifyPayment(member, false)}
                              style={{
                                background: '#10b981',
                                border: 'none',
                                color: '#ffffff',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Approve Receipt
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>✗ Unpaid</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEditForm(member)}
                            style={{
                              background: '#3b82f6',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '4px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member.id)}
                            style={{
                              background: '#ef4444',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '4px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </section>

      {/* Manual Add / Edit Modal */}
      {isFormOpen && (
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
            border: '1px solid #3b82f6',
            borderRadius: '1.25rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsFormOpen(false)}
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

            <h2 style={{ color: '#ffffff', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
              {isEditMode ? 'Edit Member Profile' : 'Add Member Manually'}
            </h2>

            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>First Name</label>
                  <input 
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Last Name</label>
                  <input 
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Preferred Email</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>UCalgary Email (optional)</label>
                  <input 
                    type="email"
                    value={ucalgaryEmail}
                    onChange={e => setUcalgaryEmail(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>UCID</label>
                  <input 
                    type="text"
                    value={ucid}
                    onChange={e => setUcid(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Program (optional)</label>
                  <input 
                    type="text"
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Year of Study (optional)</label>
                  <select
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="">Select Year</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interests Glow Toggle checkboxes */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>Club Interests</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {Object.keys(interests).map((key) => {
                    const isSelected = interests[key];
                    return (
                      <div 
                        key={key} 
                        onClick={() => setInterests(p => ({ ...p, [key]: !p[key] }))}
                        style={{
                          padding: '0.6rem 1rem',
                          background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: isSelected ? '#60a5fa' : '#cbd5e1',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontWeight: 600,
                          userSelect: 'none',
                          boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox"
                    id="feesPaid"
                    checked={feesPaid}
                    onChange={e => setFeesPaid(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="feesPaid" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>Fees Paid ($20.00)</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox"
                    id="alumniCheck"
                    checked={alumni}
                    onChange={e => setAlumni(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="alumniCheck" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>Mark as Alumni</label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Payment Method</label>
                  <input 
                    type="text"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    placeholder="Stripe, E-Transfer, Cash, etc."
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Payment Reference</label>
                  <input 
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Transaction ID / Receipt #"
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{ background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.6rem 2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Waiver Review Modal */}
      {viewWaiverMember && (
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
            border: '1px solid #f59e0b',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setViewWaiverMember(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '0.5rem', borderRadius: '8px' }}>
                🙋
              </div>
              <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Fee Waiver Request</h3>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              Applicant: <strong style={{ color: '#ffffff' }}>{viewWaiverMember.firstName} {viewWaiverMember.lastName}</strong>
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Preferred Email: <strong style={{ color: '#60a5fa' }}>{viewWaiverMember.email}</strong>
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1.25rem',
              color: '#cbd5e1',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
              whiteSpace: 'pre-wrap'
            }}>
              {viewWaiverMember.fee_waiver_reason || 'No details provided.'}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => handleDenyWaiver(viewWaiverMember)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Reject Waiver
              </button>
              <button 
                onClick={() => handleVerifyPayment(viewWaiverMember, true)}
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Approve Waiver
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
