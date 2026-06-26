import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function MembershipSignUp() {
  const navigate = useNavigate();
  const { alert } = useDialog();

  // Form inputs state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredEmail, setPreferredEmail] = useState('');
  const [ucalgaryEmail, setUcalgaryEmail] = useState('');
  const [ucid, setUcid] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [feesWaived, setFeesWaived] = useState('no'); // 'yes' or 'no'
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(true);

  // Interests state
  const [interests, setInterests] = useState({
    debater: false,
    judge: false,
    volunteer: false,
    chill: false
  });

  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showWaivedInfo, setShowWaivedInfo] = useState(false);

  const toggleInterest = (key) => {
    setInterests(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required.");
      return false;
    }

    // Valid email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(preferredEmail.trim())) {
      alert("Please enter a valid preferred email address.");
      return false;
    }

    if (!emailRegex.test(ucalgaryEmail.trim()) || !ucalgaryEmail.trim().toLowerCase().endsWith('@ucalgary.ca')) {
      alert("Please enter a valid UCalgary email address ending with @ucalgary.ca.");
      return false;
    }

    // UCID digits check and length check (at least 8 digits)
    const ucidRegex = /^\d+$/;
    if (!ucidRegex.test(ucid.trim()) || ucid.trim().length < 8) {
      alert("UCID must contain only numbers and be at least 8 digits long.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const prefEmailClean = preferredEmail.trim().toLowerCase();
    const ucalgaryEmailClean = ucalgaryEmail.trim().toLowerCase();

    try {
      // 1. Check if email already exists in Firestore members collection
      const membersRef = collection(db, 'members');
      const qPref = query(membersRef, where('email', '==', prefEmailClean));
      const qUCalgary = query(membersRef, where('ucalgaryEmail', '==', ucalgaryEmailClean));

      const [prefSnap, ucalgarySnap] = await Promise.all([
        getDocs(qPref),
        getDocs(qUCalgary)
      ]);

      let existingMember = null;
      if (!prefSnap.empty) {
        existingMember = { id: prefSnap.docs[0].id, ...prefSnap.docs[0].data() };
      } else if (!ucalgarySnap.empty) {
        existingMember = { id: ucalgarySnap.docs[0].id, ...ucalgarySnap.docs[0].data() };
      }

      if (existingMember) {
        setLoading(false);
        alert("You are already registered! Redirecting you to the payment page to complete or check your registration status.");
        navigate('/membership-sign-up/fees', {
          state: {
            memberId: existingMember.id,
            email: existingMember.email,
            firstName: existingMember.firstName,
            lastName: existingMember.lastName,
            feesWaived: feesWaived
          }
        });
        return;
      }

      // 2. Create mailing list subscriber first
      const subscribersRef = collection(db, 'subscribers');
      const newSubscriber = {
        email: prefEmailClean,
        ucalgaryEmail: ucalgaryEmailClean,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        listType: 'ucds_members',
        lists: ['newsletter'],
        active: newsletterSubscribe,
        'newsletter-subscribe': newsletterSubscribe,
        grade: year,
        institution: 'University of Calgary',
        club: 'The University of Calgary Debate Society',
        city: 'Calgary',
        region: 'Alberta',
        country: 'Canada',
        createdAt: new Date().toISOString()
      };
      const subDocRef = await addDoc(subscribersRef, newSubscriber);

      // 3. Create new member record in dedicated members collection
      const newMember = {
        email: prefEmailClean,
        ucalgaryEmail: ucalgaryEmailClean,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        ucid: ucid.trim(),
        program: program.trim(),
        grade: year,
        debater: interests.debater,
        judge: interests.judge,
        volunteer: interests.volunteer,
        chilling: interests.chill,
        fees_paid: false,
        alumni: false,
        subscriberId: subDocRef.id, // linked reference
        'newsletter-subscribe': newsletterSubscribe,
        institution: 'University of Calgary',
        club: 'The University of Calgary Debate Society',
        city: 'Calgary',
        region: 'Alberta',
        country: 'Canada',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(membersRef, newMember);

      setLoading(false);
      navigate('/membership-sign-up/fees', {
        state: {
          memberId: docRef.id,
          email: prefEmailClean,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          feesWaived: feesWaived
        }
      });

    } catch (err) {
      console.error("Error creating member registration", err);
      setLoading(false);
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <main>
      <section className="section" style={{ background: '#0b1a3a', padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>

          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              UCDS Membership
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Join the University of Calgary Debate Society today. All experience levels are welcome!
            </p>
          </div>

          {/* Quick Details List */}
          <div className="form-section-card" style={{ marginBottom: '2.5rem', background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2rem', borderRadius: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#93c5fd', fontSize: '1.3rem', borderBottom: '1px solid rgba(147, 197, 253, 0.25)', paddingBottom: '0.5rem', fontWeight: 700 }}>
              💡 Membership Details
            </h3>
            <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem', lineHeight: '1.8', margin: 0, fontSize: '0.98rem' }}>
              <li><strong>Zero Commitment</strong>: There is no minimum hour commitment. Attend rounds, workshops, and socials whenever you are free!</li>
              <li><strong>Practice Sessions</strong>: Practice rounds run twice weekly at the discretion of the club.</li>
              <li><strong>Academic Term</strong>: Memberships run from September to August of the following year.</li>
              <li><strong>Membership Dues</strong>: Active membership requires a $20.00 yearly registration fee to help fund tournament entries, socials, and resources.</li>
              <li><strong>Constitution</strong>: For further details about member rights, responsibilities, and guidelines, please review the <a href="/resources/internal/constitution" style={{ color: '#60a5fa', textDecoration: 'underline' }}>UCDS Constitution</a>.</li>
            </ul>
          </div>

          {/* Comparison Table */}
          <div className="form-section-card" style={{ marginBottom: '3rem', background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2rem', borderRadius: '1.25rem', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#93c5fd', fontSize: '1.3rem', borderBottom: '1px solid rgba(147, 197, 253, 0.25)', paddingBottom: '0.5rem', fontWeight: 700 }}>
              📊 Package Comparison
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', textAlign: 'left', minWidth: '600px', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', fontWeight: 700 }}>Membership Tiers</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>None</th>
                  <th style={{ padding: '1rem', color: '#60a5fa', fontWeight: 700 }}>General</th>
                  <th style={{ padding: '1rem', color: '#34d399', fontWeight: 700 }}>Good Standing</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>Fees</td>
                  <td style={{ padding: '1rem' }}>Free</td>
                  <td style={{ padding: '1rem' }}>$20</td>
                  <td style={{ padding: '1rem', position: 'relative' }}>
                    <span>Free</span>
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', marginLeft: '0.4rem', cursor: 'pointer', outline: 'none', fontSize: '1rem' }}
                    >
                      ❔
                    </button>
                    {showTooltip && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#0a192f',
                        color: '#f8fafc',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        fontSize: '0.85rem',
                        width: '240px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        lineHeight: '1.4'
                      }}>
                        Must be a general member with a total of 15 hours or more club activity in the current term.
                      </div>
                    )}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Notice of all UCDS events</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Participate in practices</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Access to debate resources</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Compete at tournaments for UCDS</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Subsidized socials and tournaments</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Vote for club resolutions/executives</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>Become an executive</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#ef4444' }}>❌</td>
                  <td style={{ padding: '1rem', color: '#10b981' }}>✔</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Form Card */}
          <div className="form-section-card" style={{ background: 'rgba(17, 40, 84, 0.45)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '3rem', borderRadius: '1.25rem' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', textAlign: 'center', borderBottom: '1px solid rgba(147, 197, 253, 0.25)', marginBottom: '2rem', paddingBottom: '0.75rem', fontSize: '1.45rem', fontWeight: 700 }}>
              📝 Membership Sign-up Form
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="text-input"
                    placeholder="e.g. Yo"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="text-input"
                    placeholder="e.g. mama"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="preferredEmail">Preferred Email Address</label>
                <input
                  type="email"
                  id="preferredEmail"
                  className="text-input"
                  placeholder="e.g. yo.mama@gmail.com"
                  value={preferredEmail}
                  onChange={e => setPreferredEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ucalgaryEmail">UCalgary Email Address (@ucalgary.ca)</label>
                <input
                  type="email"
                  id="ucalgaryEmail"
                  className="text-input"
                  placeholder="e.g. yo.mama@ucalgary.ca"
                  value={ucalgaryEmail}
                  onChange={e => setUcalgaryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ucid">UCalgary UCID (8+ digit number)</label>
                <input
                  type="text"
                  id="ucid"
                  className="text-input"
                  placeholder="e.g. 30123456"
                  value={ucid}
                  onChange={e => setUcid(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="program">Program of Study (Optional)</label>
                  <input
                    type="text"
                    id="program"
                    className="text-input"
                    placeholder="e.g. Bachelor of Science in Physics"
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">Academic Year (Optional)</label>
                  <select
                    id="year"
                    className="select-input"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    style={{ appearance: 'none' }}
                  >
                    <option value="" style={{ color: '#94a3b8' }}>Select...</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1)} style={{ color: '#fff' }}>Year {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Waived Fees Check */}
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <label style={{ margin: 0 }}>Request fee waiver?</label>
                  <button
                    type="button"
                    onMouseEnter={() => setShowWaivedInfo(true)}
                    onMouseLeave={() => setShowWaivedInfo(false)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', outline: 'none', fontSize: '1rem' }}
                  >
                    ❔
                  </button>
                  {showWaivedInfo && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#0a192f',
                      color: '#f8fafc',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      width: '280px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      lineHeight: '1.4'
                    }}>
                      Debaters in financial situations that prevent them from paying fees are eligible to have their registration fee and other associated costs subsidized. If you need assistance please email us finance@ucds.ca
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                  <div
                    onClick={() => setFeesWaived('yes')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      background: feesWaived === 'yes' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: feesWaived === 'yes' ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: feesWaived === 'yes' ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: feesWaived === 'yes' ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Yes</div>
                  </div>
                  <div
                    onClick={() => setFeesWaived('no')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      background: feesWaived === 'no' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: feesWaived === 'no' ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: feesWaived === 'no' ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: feesWaived === 'no' ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>No</div>
                  </div>
                </div>
              </div>

              {/* Interests Glow Checkboxes */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ marginBottom: '1rem' }}>Interested Club Activity Roles (Select all that apply)</label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* Judging */}
                  <div
                    onClick={() => toggleInterest('judge')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      background: interests.judge ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: interests.judge ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: interests.judge ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: interests.judge ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>🧑‍⚖️ Judging</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Judge and assess debate rounds!</div>
                  </div>

                  {/* Debating */}
                  <div
                    onClick={() => toggleInterest('debater')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      background: interests.debater ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: interests.debater ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: interests.debater ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: interests.debater ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>🗣️ Debating</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Competing and practicing!</div>
                  </div>

                  {/* Volunteering */}
                  <div
                    onClick={() => toggleInterest('volunteer')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      background: interests.volunteer ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: interests.volunteer ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: interests.volunteer ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: interests.volunteer ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>🤝 Volunteering</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Help out UCDS with events!</div>
                  </div>

                  {/* Chilling */}
                  <div
                    onClick={() => toggleInterest('chill')}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      background: interests.chill ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: interests.chill ? '2px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                      color: interests.chill ? '#60a5fa' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: interests.chill ? '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 10px rgba(96, 165, 250, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' }}>☕ Chilling</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Come hang out with no pressure!</div>
                  </div>

                </div>
              </div>

              {/* Newsletter subscription checkbox */}
              <div className="form-group" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <input
                  type="checkbox"
                  id="newsletterSubscribe"
                  checked={newsletterSubscribe}
                  onChange={e => setNewsletterSubscribe(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="newsletterSubscribe" style={{ margin: 0, color: '#cbd5e1', fontSize: '0.98rem', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                  Sign up for UCDS Newsletters!
                </label>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="form-submit-btn"
                  style={{ width: '100%', maxWidth: '400px' }}
                >
                  {loading ? 'Submitting registration...' : 'Continue to Payments'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>
    </main>
  );
}
