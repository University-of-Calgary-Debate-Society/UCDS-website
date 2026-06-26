import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, where, doc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

export default function DebugPortal() {
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Debug log state
  const [debugLog, setDebugLog] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState('core');

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
  // 1. CORE DATABASE SEEDER
  // -------------------------------------------------------------
  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    if (!await confirm("This will seed mock data for ledger, subscribers, blog posts, allowed emails, and executives. Continue?")) return;

    setIsSeeding(true);
    setDebugLog("Initializing Core Firestore Collections...\n");
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
      setDebugLog(prev => prev + "🎉 Core Database seeded successfully!\n");
      alert("Successfully seeded core database!");
    } catch (err) {
      setDebugLog(prev => prev + `❌ Error seeding database: ${err.message}\n`);
    } finally {
      setIsSeeding(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SOCIAL MEDIA SEEDER
  // -------------------------------------------------------------
  const handleSeedSocialPosts = async () => {
    if (isSeeding) return;
    if (!await confirm("This will seed 3 mock social media posts into the 'posts' collection. Continue?")) return;

    setIsSeeding(true);
    setDebugLog("Seeding Mock Social Media Posts...\n");
    try {
      const postsCol = collection(db, 'posts');
      const mockData = [
        {
          type: 'instagram',
          title: "Calgary Fall Open Results",
          imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
          imageUrls: [
            "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop"
          ],
          postUrl: "https://www.instagram.com/ucalgary.debate/",
          caption: "**Congratulations** to our teams at the Calgary Fall Open!\n\nSpecial shoutout to our finalists and novice speakers for their amazing performances. 🏆🎉\n\nCheck out results here: https://cusid.ca\n\n#DebateUofC #CUSID",
          likes: 48,
          date: "2026-06-25",
          platforms: ['instagram', 'discord'],
          discord_posted: false
        },
        {
          type: 'instagram',
          title: "Weekly Novice Seminars",
          imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=600&auto=format&fit=crop",
          imageUrls: [
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=600&auto=format&fit=crop"
          ],
          postUrl: "https://www.instagram.com/ucalgary.debate/",
          caption: "Novice training seminars are in full swing!\n\nJoin us __every Wednesday__ at **5:30 PM** in _ST 140_.\n\n- Interactive workshops\n- Coaching drills\n- Fun mock debates!\n\nOpen to all students! 🧠💡",
          likes: 35,
          date: "2026-06-20",
          platforms: ['instagram'],
          discord_posted: false
        },
        {
          type: 'instagram',
          title: "Team Lake Social 2026",
          imageUrl: "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=600&auto=format&fit=crop",
          imageUrls: [
            "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop"
          ],
          postUrl: "https://www.instagram.com/ucalgary.debate/",
          caption: "Throwback to our team social at the lake!\n\nBonding, campfires, and endless debates about the most trivial arguments. __Grateful__ for our amazing community. 🌲⛺️",
          likes: 52,
          date: "2026-06-15",
          platforms: ['instagram', 'discord'],
          discord_posted: false
        }
      ];

      for (const item of mockData) {
        const q = query(postsCol, where('caption', '==', item.caption));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(postsCol, item);
        }
      }
      setDebugLog(prev => prev + "✅ Social posts seeded successfully.\n🎉 Database social entries initialized!\n");
      alert("Successfully seeded mock social posts!");
    } catch (err) {
      setDebugLog(prev => prev + `❌ Error seeding social posts: ${err.message}\n`);
    } finally {
      setIsSeeding(false);
    }
  };

  // -------------------------------------------------------------
  // 3. CALENDAR EVENTS SEEDER
  // -------------------------------------------------------------
  const handleSeedCalendarEvents = async () => {
    if (isSeeding) return;
    if (!await confirm("This will seed 5 mock events (tournaments, meetings, practice seminars, socials) into the 'calendar_events' collection. Continue?")) return;

    setIsSeeding(true);
    setDebugLog("Seeding Mock Calendar Events...\n");
    try {
      const batch = writeBatch(db);
      const calendarCol = collection(db, 'calendar_events');

      const today = new Date();
      const formatDateOffset = (offset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        return d.toISOString().split('T')[0];
      };

      const mockData = [
        {
          title: "Weekly Novice Seminar",
          startDate: formatDateOffset(1),
          endDate: formatDateOffset(1),
          date: formatDateOffset(1),
          startTime: "17:30",
          endTime: "19:30",
          category: "practice",
          location: "CHE 110",
          description: "Introduction to British Parliamentary format and constructive speech drills. Open to all novice and returning debaters!",
          link: "https://ucds.ca/#/join",
          createdAt: new Date().toISOString()
        },
        {
          title: "UCDS Executive Meeting",
          startDate: formatDateOffset(3),
          endDate: formatDateOffset(3),
          date: formatDateOffset(3),
          startTime: "13:00",
          endTime: "15:00",
          category: "meeting",
          location: "UCDS Clubroom (SU 252) & Zoom",
          description: "Monthly board check-in. Agenda includes Summer Cup registrations update, finance audits, and newsletter dispatch approvals.",
          link: "",
          createdAt: new Date().toISOString()
        },
        {
          title: "Calgary Fall Debate Open",
          startDate: formatDateOffset(30),
          endDate: formatDateOffset(31), // Multi-day tournament
          date: formatDateOffset(30),
          startTime: "09:00",
          endTime: "18:00",
          category: "tournament",
          location: "Science Theatres ST 140",
          description: "Our annual local open championship! BP format. 5 rounds of debate, semi-finals, and novice/open finals. Teams from across Western Canada welcome.",
          link: "https://ucds.ca/#/events",
          createdAt: new Date().toISOString()
        },
        {
          title: "Debate and Pizza Social Night",
          startDate: formatDateOffset(5),
          endDate: formatDateOffset(5),
          date: formatDateOffset(5),
          startTime: "18:00",
          endTime: "21:00",
          category: "social",
          location: "The Last Defence Lounge",
          description: "Join us for board games, casual debates, and pizza! A great opportunity to socialize and meet the executive team.",
          link: "",
          createdAt: new Date().toISOString()
        },
        {
          title: "Calgary Summer Cup",
          startDate: "2026-07-18",
          endDate: "2026-07-19", // Multi-day
          date: "2026-07-18",
          startTime: "08:30",
          endTime: "19:00",
          category: "tournament",
          location: "University of Calgary Campus",
          description: "Our flagship high school and junior high debate tournament! 4 rounds of debate, lunch included, and awards ceremonies.",
          link: "https://ucds.ca/#/events/calgary-summer-cup",
          createdAt: new Date().toISOString()
        }
      ];

      // Query existing to prevent duplicate seeding
      const snap = await getDocs(calendarCol);
      let count = 0;
      
      mockData.forEach(item => {
        const dup = snap.docs.some(docSnap => docSnap.data().title === item.title && docSnap.data().startDate === item.startDate);
        if (!dup) {
          const newDocRef = doc(calendarCol);
          batch.set(newDocRef, item);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        setDebugLog(prev => prev + `✅ Seeded ${count} mock calendar events.\n🎉 Calendar events database initialized!\n`);
        alert(`Successfully seeded ${count} calendar events!`);
      } else {
        setDebugLog(prev => prev + "ℹ️ Mock events already exist in the database. Skipped duplicate seeding.\n");
        alert("Mock events already exist in database.");
      }
    } catch (err) {
      setDebugLog(prev => prev + `❌ Error seeding calendar events: ${err.message}\n`);
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
          <div className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1000px', margin: '4rem auto', textAlign: 'left', animation: 'fadeInDown 0.4s ease-out' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Debugging & Seeding Portal</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Initialize Firestore collections with default mock data entries.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                Back to Dashboard
              </Link>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              {[
                { id: 'core', label: '🗄️ Core Database' },
                { id: 'socials', label: '📢 Social Media Posts' },
                { id: 'calendar', label: '📅 Calendar Events' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: activeTab === tab.id ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)',
                    background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab Panel */}
            <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              {activeTab === 'core' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.3s ease-out' }}>
                  <h3 style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>Core Database Seeder</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                    This tool populates core database tables required for the society's operation. It seeds default executive officers (President, VP Internal, VP Finance/Tech), mock financial ledger entries (refunds, fees, domain costs), signup allowed email list authorizations, and standard blog posts.
                  </p>
                  <button 
                    onClick={handleSeedDatabase} 
                    disabled={isSeeding}
                    className="exec-btn" 
                    style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#dc2626', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.25)' }}
                  >
                    {isSeeding ? "Seeding Core Data..." : "Seed Core Database"}
                  </button>
                </div>
              )}

              {activeTab === 'socials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.3s ease-out' }}>
                  <h3 style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>Social Media Posts Seeder</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                    This tool seeds mock Instagram posts and native Discord message announcements. Use this tab to populate the socials feed and verify post editing triggers, platform filters, markdown parser operations, and image galleries.
                  </p>
                  <button 
                    onClick={handleSeedSocialPosts} 
                    disabled={isSeeding}
                    className="exec-btn" 
                    style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)' }}
                  >
                    {isSeeding ? "Seeding Socials..." : "Seed Mock Social Posts"}
                  </button>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.3s ease-out' }}>
                  <h3 style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>Calendar Events Seeder</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                    This tool seeds 5 default debate society calendar events (Weekly Seminar, UCDS Board Meeting, Calgary Fall Debate Open, Debate & Pizza Social, Calgary Summer Cup). Use this tab to verify grid cell rendering, category filters, multi-day event span, Google Calendar redirects, and .ics calendar exports.
                  </p>
                  <button 
                    onClick={handleSeedCalendarEvents} 
                    disabled={isSeeding}
                    className="exec-btn" 
                    style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#0ea5e9', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)' }}
                  >
                    {isSeeding ? "Seeding Calendar..." : "Seed Mock Calendar Events"}
                  </button>
                </div>
              )}

            </div>

            {debugLog && (
              <pre style={{ marginTop: '2rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.25rem', color: '#39ff14', fontFamily: 'monospace', textAlign: 'left', fontSize: '0.85rem', maxHeight: '240px', overflowY: 'auto', lineHeight: '1.5' }}>
                {debugLog}
              </pre>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
