import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebase';

const STRIPE_LINKS = {
  30: 'https://buy.stripe.com/placeholder-30-cad',
  60: 'https://buy.stripe.com/3cIeVf6OM99mg1D0LefEk01'
};

function PieChart({ data, title }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let accumulatedAngle = 0;
  
  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8', flex: 1, background: 'rgba(15, 23, 42, 0.2)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px' }}>
        <h4 style={{ margin: '0 0 10px', color: '#93c5fd', fontSize: '0.95rem', fontWeight: 600 }}>{title}</h4>
        <p style={{ fontSize: '0.85rem', margin: 0 }}>No responses yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '280px' }}>
      <h4 style={{ margin: '0 0 15px', color: '#93c5fd', fontSize: '0.95rem', textAlign: 'center', fontWeight: 600 }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <svg width="120" height="120" viewBox="-70 -70 140 140" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            if (percentage === 0) return null;
            
            const isHovered = hoveredIndex === index;
            const scale = isHovered ? 1.05 : 1;
            
            if (percentage === 100) {
              return (
                <circle
                  key={index}
                  cx="0"
                  cy="0"
                  r="37.5"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="25"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: '0px 0px',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
                </circle>
              );
            }
            
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + (item.value / total) * 360;
            accumulatedAngle = endAngle;

            // Convert angles to radians
            const radStart = (startAngle * Math.PI) / 180;
            const radEnd = (endAngle * Math.PI) / 180;

            // Outer points
            const x1 = 50 * Math.cos(radStart);
            const y1 = 50 * Math.sin(radStart);
            const x2 = 50 * Math.cos(radEnd);
            const y2 = 50 * Math.sin(radEnd);

            // Inner points
            const x1_in = 25 * Math.cos(radStart);
            const y1_in = 25 * Math.sin(radStart);
            const x2_in = 25 * Math.cos(radEnd);
            const y2_in = 25 * Math.sin(radEnd);

            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

            const d = `
              M ${x1_in} ${y1_in}
              L ${x1} ${y1}
              A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}
              L ${x2_in} ${y2_in}
              A 25 25 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}
              Z
            `;

            return (
              <path
                key={index}
                d={d}
                fill={item.color}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: '0px 0px',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              </path>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px', textAlign: 'left' }}>
          {data.map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const isHovered = hoveredIndex === index;
            return (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  color: isHovered ? '#ffffff' : '#cbd5e1',
                  transition: 'color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
                <span style={{ fontWeight: isHovered ? 700 : 500 }}>{item.label}:</span>
                <span style={{ color: isHovered ? '#93c5fd' : '#94a3b8' }}>{item.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccess() {
  const [feeOption, setFeeOption] = useState(60);
  const [paymentTab, setPaymentTab] = useState('etransfer');
  const [copyStatus, setCopyStatus] = useState('Copy Email');
  const [pollStats, setPollStats] = useState({
    q1Yes: 0,
    q1No: 0,
    q2Sep: 0,
    q2Oct: 0,
    q2Nov: 0,
    loading: true
  });

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'polls'));
        let q1Yes = 0;
        let q1No = 0;
        let q2Sep = 0;
        let q2Oct = 0;
        let q2Nov = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.q1 === 'Yes') q1Yes++;
          else if (data.q1 === 'No') q1No++;

          if (data.q2 === 'September') q2Sep++;
          else if (data.q2 === 'October') q2Oct++;
          else if (data.q2 === 'November') q2Nov++;
        });

        setPollStats({
          q1Yes,
          q1No,
          q2Sep,
          q2Oct,
          q2Nov,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching poll data:", err);
        setPollStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPolls();
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText('ucds.debate@gmail.com').then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => {
        setCopyStatus('Copy Email');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy email: ', err);
    });
  };

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="form-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3.5rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', textAlign: 'center', maxWidth: '700px', margin: '4rem auto' }}>
            {/* Calgary Cup Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src="/photos/calgary_summer_cup_logo.png" alt="Calgary Summer Cup Logo" style={{ maxHeight: '100px', width: 'auto', filter: 'drop-shadow(0 5px 12px rgba(0,0,0,0.25))' }} />
            </div>

            {/* Checkmark Icon */}
            <div className="success-icon-wrapper" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e', color: '#22c55e' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '2.25rem', height: '2.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 style={{ fontSize: '2.75rem', background: 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Registration Received!
            </h1>
            
            <p style={{ fontSize: '1.15rem', color: '#cbd5e1', maxWidth: '550px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
              To finalize your registration, please complete the tournament fee payment below.
            </p>

            {/* Payment Options */}
            <div className="payment-container" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '25px', marginBottom: '2rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>
                  {feeOption === 30 ? 'Tournament Fee (Individual)' : 'Tournament Fee (Team of 2)'}
                </span>
                <span style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>
                  ${feeOption.toFixed(2)} CAD
                </span>
              </div>

              {/* Selector */}
              <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Payment Option:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="fee-option" 
                      value="30" 
                      checked={feeOption === 30}
                      onChange={() => setFeeOption(30)}
                      style={{ accentColor: '#2563eb', transform: 'scale(1.15)' }} 
                    />
                    <span>Pay for Individual Debater — <strong>$30.00 CAD</strong></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="fee-option" 
                      value="60" 
                      checked={feeOption === 60}
                      onChange={() => setFeeOption(60)}
                      style={{ accentColor: '#2563eb', transform: 'scale(1.15)' }} 
                    />
                    <span>Pay for Full Team (Both Debaters) — <strong>$60.00 CAD</strong></span>
                  </label>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="payment-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  className={`payment-tab-btn ${paymentTab === 'etransfer' ? 'active' : ''}`} 
                  onClick={() => setPaymentTab('etransfer')}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', borderRadius: '6px', transition: 'all 0.2s ease' }}
                >
                  Interac E-Transfer
                </button>
                <button 
                  className={`payment-tab-btn ${paymentTab === 'stripe' ? 'active' : ''}`} 
                  onClick={() => setPaymentTab('stripe')}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', borderRadius: '6px', transition: 'all 0.2s ease' }}
                >
                  Stripe (Coming Soon)
                </button>
              </div>

              {/* Interac E-Transfer Pane */}
              {paymentTab === 'etransfer' && (
                <div id="etransfer-panel" className="payment-panel active">
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', borderLeft: '4px solid #2563eb', padding: '12px 16px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', color: '#93c5fd', lineHeight: 1.5 }}>
                    💡 <strong>E-Transfer is preferred</strong> as it avoids transaction fees for the society.
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '15px', lineHeight: 1.6 }}>
                    Please send an Interac E-Transfer of <strong>${feeOption.toFixed(2)} CAD</strong> to the following address:
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '8px', marginBottom: '15px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>ucds.debate@gmail.com</span>
                    <button 
                      onClick={copyEmail} 
                      style={{ background: copyStatus === 'Copied!' ? '#22c55e' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      {copyStatus}
                    </button>
                  </div>

                  <ul style={{ fontSize: '0.9rem', color: '#94a3b8', paddingLeft: '20px', lineHeight: 1.6, margin: 0 }}>
                    <li>Include <strong>both debaters' names</strong> in the transfer message notes.</li>
                    <li>Your spot will be secured once the payment is processed.</li>
                  </ul>
                </div>
              )}

              {/* Stripe Pane */}
              {paymentTab === 'stripe' && (
                <div id="stripe-panel" className="payment-panel">
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderLeft: '4px solid #6366f1', padding: '12px 16px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', color: '#c7d2fe', lineHeight: 1.5 }}>
                    ⏳ Stripe Payments are <strong>Coming Soon</strong>.
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
                    Direct card payments via Stripe are currently under maintenance and will be available soon. Please use **Interac E-Transfer** to complete your Calgary Summer Cup registration.
                  </p>
                </div>
              )}
            </div>

            {/* Poll Results Section */}
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '25px', marginBottom: '2rem', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Public Interest Poll Results
              </h2>

              {pollStats.loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                  <p>Loading poll results...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '10px' }}>
                  <PieChart
                    title="Q1: Interested in In-Person Tournament?"
                    data={[
                      { label: 'Yes', value: pollStats.q1Yes, color: '#10b981' },
                      { label: 'No', value: pollStats.q1No, color: '#ef4444' }
                    ]}
                  />
                  <PieChart
                    title="Q2: Preferred Month"
                    data={[
                      { label: 'September', value: pollStats.q2Sep, color: '#3b82f6' },
                      { label: 'October', value: pollStats.q2Oct, color: '#8b5cf6' },
                      { label: 'November', value: pollStats.q2Nov, color: '#f59e0b' }
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="success-actions" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2.5rem' }}>
              <Link to="/" className="success-btn success-btn-primary" style={{ padding: '0.95rem 1.75rem', borderRadius: '999px', textDecoration: 'none', fontWeight: 600 }}>
                Back to Homepage
              </Link>
              <Link to="/events" className="success-btn success-btn-secondary" style={{ padding: '0.95rem 1.75rem', borderRadius: '999px', textDecoration: 'none', fontWeight: 600 }}>
                More Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
