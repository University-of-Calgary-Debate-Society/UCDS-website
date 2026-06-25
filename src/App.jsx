import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DialogProvider } from './context/DialogContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Events from './pages/Events';
import CalgarySummerCup from './pages/CalgarySummerCup';
import Registration from './pages/Registration';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Blog from './pages/Blog';
import Resources from './pages/Resources';
import Connect from './pages/Connect';
import Join from './pages/Join';
import JoinWelcome from './pages/JoinWelcome';
import Unsubscribe from './pages/Unsubscribe';
import Void from './pages/Void';
import ExecutivePortal from './pages/executive/ExecutivePortal';
import RosterManager from './pages/executive/RosterManager';
import LedgerManager from './pages/executive/LedgerManager';
import EmailCampaignManager from './pages/executive/EmailCampaignManager';
import BlogManager from './pages/executive/BlogManager';
import AccessControlManager from './pages/executive/AccessControlManager';
import DebugPortal from './pages/executive/DebugPortal';

// Component to handle scroll restoration and run the IntersectionObserver for scroll animations
function RouteObserver() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to the top on navigation
    window.scrollTo(0, 0);

    // Toggle events-body class based on path to load the page background image
    const path = location.pathname;
    const isEventsBodyRoute = path.startsWith('/events') || path.startsWith('/connect/unsubscribe') || path.startsWith('/executive');
    
    if (isEventsBodyRoute) {
      document.body.classList.add('events-body');
    } else {
      document.body.classList.remove('events-body');
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Robustly wait for React to mount elements in the DOM before setting up observer
    let attempts = 0;
    const interval = setInterval(() => {
      const elements = document.querySelectorAll('.animate-on-scroll, .lift-out-shadow');
      const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';

      if (elements.length > 0 || attempts > 20) {
        clearInterval(interval);
        elements.forEach(el => {
          if (isAnimationsDisabled) {
            el.classList.add('visible');
          } else {
            observer.observe(el);
          }
        });
      }
      attempts++;
    }, 50);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [location]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAnimationsDisabled = localStorage.getItem('animationsDisabled') === 'true';

  return (
    <div key={location.pathname} className={`page-transition-wrapper ${isAnimationsDisabled ? 'no-animations' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/calgary-summer-cup" element={<CalgarySummerCup />} />
        <Route path="/events/calgary-summer-cup/registration" element={<Registration />} />
        <Route path="/events/calgary-summer-cup/registration/success" element={<RegistrationSuccess />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/connect/unsubscribe" element={<Unsubscribe />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/welcome" element={<JoinWelcome />} />
        <Route path="/void" element={<Void />} />
        <Route path="/executive" element={<ExecutivePortal />} />
        <Route path="/executive/roster" element={<RosterManager />} />
        <Route path="/executive/ledger" element={<LedgerManager />} />
        <Route path="/executive/email" element={<EmailCampaignManager />} />
        <Route path="/executive/blog" element={<BlogManager />} />
        <Route path="/executive/access" element={<AccessControlManager />} />
        <Route path="/executive/debug" element={<DebugPortal />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <DialogProvider>
      <Router>
        <RouteObserver />
        <Header />
        <AnimatedRoutes />
        <Footer />
      </Router>
    </DialogProvider>
  );
}

export default App;


