import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function DebugPortal() {
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Debug log state
  const [debugLog, setDebugLog] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

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
  // DB SEEDER HANDLER
  // -------------------------------------------------------------
  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    if (!await confirm("This will seed mock data for ledger, subscribers, blog posts, allowed emails, and executives. Continue?")) return;

    setIsSeeding(true);
    setDebugLog("Initializing Firestore Collections...\n");
    try {
      // 1. Add mock ledger entries
      const mockTxs = [
        { date: '2026-06-20', method: 'Credit Card', description: 'Domain registration renewal (ucds.ca)', reference: 'TXN-90124', sender: '', recipient: 'Hover', deposit: null, withdrawal: 18.50, balance: 2709.00 },
        { date: '2026-06-15', method: 'E-Transfer', description: 'Calgary Summer Cup Entry Fee Payments (Pre-regs)', reference: 'C1AxJf***mc9', sender: 'John Doe', recipient: 'ucds.debate@gmail.com', deposit: 180.00, withdrawal: null, balance: 2727.50 },
        { date: '2026-04-28', method: 'Other', description: 'SU Club Funding Disbursement', reference: '', sender: 'SU Calgary', recipient: 'ucds.debate@gmail.com', deposit: 500.00, withdrawal: null, balance: 2547.50 },
        { date: '2026-03-12', method: 'Cash', description: 'Pizza Expense for Practice', reference: '', sender: '', recipient: 'Pizza Hut', deposit: null, withdrawal: 75.45, balance: 2047.50 },
        { date: '2026-02-15', method: 'E-Transfer', description: 'Membership Fees Collection (Winter)', reference: 'C1A5xH***vkG', sender: 'Jane Smith', recipient: 'ucds.debate@gmail.com', deposit: 220.00, withdrawal: null, balance: 2122.95 },
        { date: '2026-01-10', method: 'E-Transfer', description: 'CUSID National Registration Fees', reference: 'C1AAQf***8Mt', sender: '', recipient: 'CUSID', deposit: null, withdrawal: 320.00, balance: 1902.95 }
      ];

      setDebugLog(prev => prev + "Writing Ledger Transactions...\n");
      const ledgerCol = collection(db, 'ledger');
      const snapLedger = await getDocs(ledgerCol);
      if (snapLedger.empty) {
        for (const tx of mockTxs) {
          await addDoc(ledgerCol, tx);
        }
        setDebugLog(prev => prev + "✅ Ledger seeded.\n");
      } else {
        setDebugLog(prev => prev + "ℹ️ Ledger table not empty. Skipped.\n");
      }

      // 2. Add mock subscribers
      const mockSubs = [
        { email: 'business.michaelwang@gmail.com', fullName: 'Michael Wang', grade: 'Grade 12', lists: ['newsletter'], active: true, createdAt: new Date().toISOString() },
        { email: 'bhuvigoyal1107@gmail.com', fullName: 'Bhuvi Goyal', grade: 'Grade 12', lists: ['newsletter', 'competitors'], active: true, createdAt: new Date().toISOString() },
        { email: 'ucdebate@ucalgary.ca', fullName: 'UofC Debate', grade: '', lists: ['newsletter'], active: true, createdAt: new Date().toISOString() }
      ];

      setDebugLog(prev => prev + "Writing Subscriber Directory...\n");
      const subsCol = collection(db, 'subscribers');
      const snapSubs = await getDocs(subsCol);
      if (snapSubs.empty) {
        for (const sub of mockSubs) {
          await addDoc(subsCol, sub);
        }
        setDebugLog(prev => prev + "✅ Subscribers seeded.\n");
      } else {
        setDebugLog(prev => prev + "ℹ️ Subscribers list not empty. Skipped.\n");
      }

      // 3. Add allowed emails
      const mockAllowed = [
        { email: 'business.michaelwang@gmail.com' },
        { email: 'bhuvigoyal1107@gmail.com' },
        { email: 'ucds.debate@gmail.com' }
      ];

      setDebugLog(prev => prev + "Writing Allowed Emails List...\n");
      const allowedCol = collection(db, 'allowed_emails');
      for (const item of mockAllowed) {
        const qAllowed = query(allowedCol, where('email', '==', item.email));
        const snapAllowed = await getDocs(qAllowed);
        if (snapAllowed.empty) {
          await addDoc(allowedCol, {
            email: item.email,
            addedAt: new Date().toISOString()
          });
        }
      }
      setDebugLog(prev => prev + "✅ Allowed signup emails seeded.\n");

      // 4. Add mock blog posts
      const mockPosts = [
        {
          title: "UCDS Kickoff Meeting 2026",
          date: "2026-05-15",
          summary: "We held our first kickoff session. Read details here...",
          content: "<p>We had an amazing kickoff meeting this season, with over 30 new debaters joining us in CHE110. We ran an exhibition debate on the space exploration budget. stay tuned for future workshops.</p>",
          updatedAt: new Date().toISOString()
        },
        {
          title: "Calgary Summer Cup Announced!",
          date: "2026-06-01",
          summary: "The Calgary Summer Cup is back for 2026. Join us online...",
          content: "<p>We are thrilled to officially announce the Calgary Summer Cup 2026, taking place online over Discord on July 25-26. Registration is open on the website!</p>",
          updatedAt: new Date().toISOString()
        }
      ];

      setDebugLog(prev => prev + "Writing Blog Posts...\n");
      const postsCol = collection(db, 'posts');
      for (const post of mockPosts) {
        const qPost = query(postsCol, where('title', '==', post.title));
        const snapPost = await getDocs(qPost);
        if (snapPost.empty) {
          await addDoc(postsCol, post);
        }
      }
      setDebugLog(prev => prev + "✅ Blog posts seeded.\n");

      // 5. Add mock executives
      const mockExecs = [
        { name: 'Sofija Trkulja', role: 'President', email: 'ucds.debate@gmail.com', aboutMe: 'Active debater and coordinator for UCDS club events.', experience: '4 years of competitive CUSID debate.', whyJoined: 'To foster critical thinking and leadership skills.', order: 1, photo: '' },
        { name: 'Bhuvi Goyal', role: 'VP of Internal / Tournament Organizer', email: 'bhuvigoyal1107@gmail.com', aboutMe: 'Organizes internal seminars, workshops, and tournaments.', experience: '3 years debating in regional and national tournaments.', whyJoined: 'To build a strong community of critical thinkers.', order: 2, photo: '' },
        { name: 'Menooha Koneru', role: 'Director of Equity', email: 'ucds.debate@gmail.com', aboutMe: 'Maintains fairness, inclusion, and a welcoming training environment.', experience: 'Experienced equity officer and CUSID debater.', whyJoined: 'To make university debate accessible to everyone.', order: 3, photo: '' },
        { name: 'Michael Wang', role: 'VP of Finance / Tech Lead & Systems Admin', email: 'business.michaelwang@gmail.com', aboutMe: 'Manages technology stacks, emails, and finances.', experience: 'Tech admin and competitive debater.', whyJoined: 'To apply technical systems to empower the debate society.', order: 4, photo: '' },
        { name: 'Tori Iles', role: 'VP of Outreach', email: 'ucds.debate@gmail.com', aboutMe: 'Coordinates public communications and school outreach programs.', experience: 'Outreach lead and public speaker.', whyJoined: 'To introduce public speaking to high school classrooms.', order: 5, photo: '' },
        { name: 'Md Samiu Hossain', role: 'Director of Tournaments', email: 'ucds.debate@gmail.com', aboutMe: 'Coordinates logistics for hosting regional debates.', experience: 'Tournament designer and debater.', whyJoined: 'To organize competitive opportunities for UofC students.', order: 6, photo: '' },
        { name: 'Laiba Nasir', role: 'Director of Training', email: 'ucds.debate@gmail.com', aboutMe: 'Leads educational workshops for novice debaters.', experience: 'Training coach and public speaker.', whyJoined: 'To build confidence in public speaking.', order: 7, photo: '' },
        { name: 'Ben Goud', role: 'Director of Training', email: 'ucds.debate@gmail.com', aboutMe: 'Leads training seminars and debate drills.', experience: 'Training coordinator and experienced debater.', whyJoined: 'To share my passion for argumentation and advocacy.', order: 8, photo: '' }
      ];

      setDebugLog(prev => prev + "Writing Executive Directory...\n");
      const execsCol = collection(db, 'executives');
      for (const exec of mockExecs) {
        const qExec = query(execsCol, where('name', '==', exec.name));
        const snapExec = await getDocs(qExec);
        if (snapExec.empty) {
          await addDoc(execsCol, exec);
        }
      }
      setDebugLog(prev => prev + "✅ Executives seeded.\n");

      setDebugLog(prev => prev + "🎉 Database seeded successfully!\n");
    } catch (err) {
      setDebugLog(prev => prev + `❌ Error seeding database: ${err.message}\n`);
    } finally {
      setIsSeeding(false);
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
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Debugging & Seeding Portal</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Initialize Firestore collections with default mock data entries.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            <div style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.15)', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', maxWidth: '800px', margin: '1rem auto' }}>
              <h4 style={{ color: '#ffffff', fontSize: '1.35rem', margin: '0 0 0.75rem', fontWeight: '700' }}>Initialize Firestore Collections</h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                Clicking the button below will check your database collections. If any collection is empty, it will seed sample ledger transactions, default subscribers, authorized signup emails, blog posts, and default executive profiles.
              </p>
              
              <button 
                onClick={handleSeedDatabase} 
                disabled={isSeeding}
                className="exec-btn exec-btn-danger" 
                style={{ padding: '0.85rem 2.5rem', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#dc2626', color: '#ffffff', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)' }}
              >
                {isSeeding ? "Seeding Database..." : "Seed Firestore Mock Data"}
              </button>

              {debugLog && (
                <pre style={{ marginTop: '2.5rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.25rem', color: '#39ff14', fontFamily: 'monospace', textAlign: 'left', fontSize: '0.85rem', maxHeight: '240px', overflowY: 'auto', lineHeight: '1.5' }}>
                  {debugLog}
                </pre>
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
