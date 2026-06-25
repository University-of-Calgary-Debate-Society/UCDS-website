import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useDialog } from '../context/DialogContext';

export default function Unsubscribe() {
  const { alert } = useDialog();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [uiState, setUiState] = useState('input'); // 'confirm', 'input', 'loading', 'success', 'error'
  const [statusTitle, setStatusTitle] = useState('Unsubscribe');
  const [statusText, setStatusText] = useState('');
  const [showResubscribe, setShowResubscribe] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  // Initial check on search query
  useEffect(() => {
    const urlEmail = searchParams.get('email') || '';
    const isResub = searchParams.get('resubscribed') === 'true';

    if (isResub && urlEmail) {
      setEmail(urlEmail);
      showSuccessState(
        'Resubscribed!',
        `The email address <strong style="color: #60a5fa;">${escapeHtml(urlEmail)}</strong> has been successfully re-activated. Welcome back!`,
        false
      );
    } else if (urlEmail) {
      setEmail(urlEmail);
      setUiState('confirm');
      setStatusTitle('Confirm Unsubscribe');
      setStatusText(`Are you sure you want to unsubscribe <strong style="color: #60a5fa;">${escapeHtml(urlEmail)}</strong> from our mailing list?`);
    } else {
      setUiState('input');
      setStatusTitle('Unsubscribe');
      setStatusText('Please enter your email address to unsubscribe from our newsletter:');
    }
  }, [searchParams]);

  const escapeHtml = (str) => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  const showSuccessState = (title, message, canResubscribe) => {
    setUiState('success');
    setStatusTitle(title);
    setStatusText(message);
    setShowResubscribe(canResubscribe);
  };

  const handleConfirmUnsubscribe = async (e) => {
    e.preventDefault();
    const targetEmail = (email || manualEmail).trim().toLowerCase();
    
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setUiState('loading');
    setStatusTitle('Processing...');
    setStatusText(`Removing ${targetEmail} from our mailing list...`);

    try {
      // Find subscriber in Firestore
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', targetEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Even if not found, we show a success message to protect privacy, 
        // but let's inform them we didn't have them in the list.
        showSuccessState(
          'Unsubscribed',
          `The email address <strong style="color: #60a5fa;">${escapeHtml(targetEmail)}</strong> was not found in our mailing list. You won't receive further emails.`,
          false
        );
        return;
      }

      // Update subscriber active state to false
      const updatePromises = querySnapshot.docs.map(subscriberDoc => {
        return updateDoc(doc(db, 'subscribers', subscriberDoc.id), {
          active: false
        });
      });
      await Promise.all(updatePromises);

      // Cache email in local state for resubscribe option
      setEmail(targetEmail);

      showSuccessState(
        'Unsubscribed',
        `The email address <strong style="color: #60a5fa;">${escapeHtml(targetEmail)}</strong> has been successfully removed from our newsletter list. We're sorry to see you go!`,
        true
      );
    } catch (err) {
      console.error(err);
      setUiState('error');
      setStatusTitle('Error');
      setStatusText('There was a problem processing your request. Please try again later or contact us at ucds.debate@gmail.com.');
    }
  };

  const handleResubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setUiState('loading');
    setStatusTitle('Processing...');
    setStatusText(`Re-activating subscription for ${email}...`);

    try {
      // Find subscriber in Firestore
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setUiState('error');
        setStatusTitle('Error');
        setStatusText('Subscriber record not found.');
        return;
      }

      // Update subscriber active state to true
      const updatePromises = querySnapshot.docs.map(subscriberDoc => {
        return updateDoc(doc(db, 'subscribers', subscriberDoc.id), {
          active: true
        });
      });
      await Promise.all(updatePromises);

      showSuccessState(
        'Resubscribed!',
        `The email address <strong style="color: #60a5fa;">${escapeHtml(email)}</strong> has been successfully re-activated. Welcome back!`,
        false
      );
    } catch (err) {
      console.error(err);
      setUiState('error');
      setStatusTitle('Error');
      setStatusText('There was a problem processing your resubscription. Please try again.');
    }
  };

  return (
    <main>
      <section className="section">
        <div className="container" style={{ padding: '0 10px' }}>
          <div className="unsubscribe-container" style={{ maxWidth: '600px', margin: '6rem auto', padding: '3.5rem 2.5rem', background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)', textAlign: 'center', color: '#ffffff' }}>
            {/* Icon */}
            <div className={`unsubscribe-icon ${uiState === 'loading' ? 'loading' : uiState === 'error' ? 'error' : ''}`} style={{ width: '70px', height: '70px', background: uiState === 'success' ? 'rgba(34, 197, 94, 0.15)' : uiState === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', border: `2px solid ${uiState === 'success' ? '#22c55e' : uiState === 'error' ? '#ef4444' : '#eab308'}`, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: uiState === 'success' ? '#22c55e' : uiState === 'error' ? '#ef4444' : '#eab308', fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {uiState === 'loading' ? '' : uiState === 'success' ? '✓' : uiState === 'error' ? '✗' : '?'}
            </div>

            <h1 className="unsubscribe-title" style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 1rem' }}>{statusTitle}</h1>
            
            {uiState === 'input' ? (
              <div className="unsubscribe-text" style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                <p>{statusText}</p>
                <input 
                  type="email" 
                  value={manualEmail} 
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="email-input-field" 
                  placeholder="your.email@example.com" 
                  style={{ width: '100%', maxWidth: '320px', padding: '0.85rem 1.25rem', borderRadius: '999px', border: '1.5px solid rgba(255, 255, 255, 0.2)', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', fontSize: '1rem', outline: 'none', margin: '1.5rem auto', display: 'block', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <p className="unsubscribe-text" style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem' }} dangerouslySetInnerHTML={{ __html: statusText }} />
            )}

            <div className="btn-group" style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {uiState === 'confirm' && (
                <button onClick={handleConfirmUnsubscribe} className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff' }}>
                  Confirm Unsubscribe
                </button>
              )}
              {uiState === 'input' && (
                <button onClick={handleConfirmUnsubscribe} className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff' }}>
                  Unsubscribe
                </button>
              )}
              {uiState === 'success' && showResubscribe && (
                <button onClick={handleResubscribe} className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff' }}>
                  Resubscribe
                </button>
              )}
              <Link to="/" className="btn btn-secondary" style={{ padding: '0.85rem 2.25rem', borderRadius: '999px', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.12)', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', textDecoration: 'none' }}>
                {uiState === 'success' ? 'Go to Homepage' : 'Cancel'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
