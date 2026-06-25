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
                  Stripe Portal
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
                    🔒 Secure transaction processed via <strong>Stripe Checkout</strong>.
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.6 }}>
                    Use the button below to navigate to the UCDS Stripe Payment Portal. You can complete the transaction using credit cards, Apple Pay, or Google Pay.
                  </p>
                  
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <a 
                      href={STRIPE_LINKS[feeOption]} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', background: '#635bff', color: '#ffffff', borderRadius: '6px', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s ease', boxShadow: '0 4px 12px rgba(99, 91, 255, 0.3)' }}
                    >
                      <span>Pay with</span>
                      <svg viewBox="0 0 40 16" fill="currentColor" style={{ height: '1.25rem', width: 'auto', verticalAlign: 'middle' }}>
                        <path d="M40 7.82c0-2.65-1.28-4.28-3.64-4.28-2.52 0-3.83 1.88-3.83 4.36 0 2.82 1.4 4.3 3.83 4.3 1.18 0 2.22-.29 2.9-.7V9.38c-.66.31-1.47.53-2.3.53-1.14 0-1.85-.48-2.04-1.36h6.24c.05-.42.1-.95.1-1.44zM36.43 6.8c.04-.74.57-1.28 1.39-1.28.75 0 1.27.52 1.3 1.28h-2.69zm-11.83-.81c-.91 0-1.52.48-1.84.83l-.1-1H19.5v8.16l2.4-.5v-3.73c.33.3.88.7 1.72.7 1.9 0 3.39-1.39 3.39-4.08 0-2.83-1.51-4.08-3.39-4.08zm-.53 6.22c-.78 0-1.18-.4-1.18-1.24v-.7c0-.85.4-1.24 1.18-1.24.82 0 1.31.7 1.31 2.12-.01 1.45-.5 2.18-1.31 2.18zm-8.8-6.22c-.85 0-1.36.4-1.64.7l-.1-.54H10.4v8.16l2.4-.5V9.45c0-1.73.58-2.28 1.6-2.28.25 0 .48.03.65.1V5.9c-.24-.05-.52-.08-.75-.08zm-7.63.15h2.4v8.16h-2.4zm0-2.62h2.4V4.92h-2.4zm-3.1 3.52c-.6-.26-1.5-.46-2.14-.46-1.07 0-1.58.46-1.58 1 0 .7 1 .8 2.65 1.2 1.98.5 3.33 1.1 3.33 3.03 0 2.37-2.02 3.08-4.33 3.08-1.07 0-2.2-.25-3.05-.73V10.1c.84.46 1.83.74 2.82.74.88 0 1.23-.29 1.23-.74 0-.66-.65-.77-2.05-1.1-1.85-.45-3.92-.85-3.92-3.08 0-2.12 1.85-3.06 4.14-3.06.94 0 1.92.2 2.7.54v2.54z"/>
                      </svg>
                    </a>
                  </div>
                  
                  <ul style={{ fontSize: '0.9rem', color: '#94a3b8', paddingLeft: '20px', lineHeight: '1.6', margin: 0 }}>
                    <li>After successful payment, your spot will be secured automatically.</li>
                    <li>Ensure you write the correct registration email on the Stripe form.</li>
                  </ul>
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
