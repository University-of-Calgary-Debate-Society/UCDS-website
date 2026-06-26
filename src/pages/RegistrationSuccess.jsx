import { useState } from 'react';
import { Link } from 'react-router-dom';

const STRIPE_LINKS = {
  30: 'https://buy.stripe.com/placeholder-30-cad',
  60: 'https://buy.stripe.com/3cIeVf6OM99mg1D0LefEk01'
};

export default function RegistrationSuccess() {
  const [feeOption, setFeeOption] = useState(60);
  const [paymentTab, setPaymentTab] = useState('etransfer');
  const [copyStatus, setCopyStatus] = useState('Copy Email');

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
