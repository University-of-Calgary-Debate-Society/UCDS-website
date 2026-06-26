import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function JoinWelcome() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus('Subscribing...');

    try {
      const subscribersRef = collection(db, 'subscribers');
      const q = query(subscribersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setStatus('You are already subscribed to our newsletter!');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        fullName: name.trim(),
        grade: '',
        lists: ['newsletter'],
        active: true,
        createdAt: new Date().toISOString()
      });

      setStatus('✅ Successfully subscribed! Welcome to the society.');
      setName('');
      setEmail('');
    } catch (err) {
      console.error(err);
      setStatus('❌ Problem subscribing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h1>Welcome to the UCDS</h1>
          </div>

          <div style={{ maxWidth: '600px', margin: '3rem auto 0' }}>
            <article className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '2.5rem', color: '#ffffff' }}>
              <h3 style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: 'none', paddingBottom: 0, marginTop: 0, marginBottom: '1rem' }}>
                Join our Newsletter
              </h3>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem' }}>
                Stay in the loop with our monthly newsletter. Get updates on upcoming events, tournament results, general details, and debate resources delivered straight to your inbox.
              </p>

              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="welcomeName" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>Full Name (Optional)</label>
                  <input
                    type="text"
                    id="welcomeName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-input"
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="welcomeEmail" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>Email Address *</label>
                  <input
                    type="email"
                    id="welcomeEmail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-input"
                    placeholder="name@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button"
                  style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', border: 'none', borderRadius: '999px', background: '#2563eb', color: '#ffffff', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Subscribe Now'}
                </button>

                {status && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', textAlign: 'center', fontWeight: '600', color: status.startsWith('✅') ? '#16a34a' : '#ef4444' }}>
                    {status}
                  </p>
                )}
              </form>
            </article>
          </div>

          <section className="spacer"></section>

          <div style={{ textAlign: 'center' }}>
            <Link to="/" className="button" style={{ textDecoration: 'none' }}>Back to Home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
