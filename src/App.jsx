import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DialogProvider } from './context/DialogContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Mascot from './components/Mascot';
import Home from './pages/Home';
import Events from './pages/Events';
import CalgarySummerCup from './pages/CalgarySummerCup';
import Registration from './pages/Registration';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Blog from './pages/Blog';
import Resources from './pages/Resources';
import Connect from './pages/Connect';
import Socials from './pages/Socials';
import Calendar from './pages/Calendar';
import Join from './pages/Join';
import JoinWelcome from './pages/JoinWelcome';
import Unsubscribe from './pages/Unsubscribe';
import Void from './pages/Void';
import DiscordInstall from './pages/void/discord/DiscordInstall';
import DiscordTermsAndPrivacy from './pages/void/discord/DiscordTermsAndPrivacy';
import ExecutivePortal from './pages/executive/ExecutivePortal';
import RosterManager from './pages/executive/RosterManager';
import LedgerManager from './pages/executive/LedgerManager';
import EmailCampaignManager from './pages/executive/EmailCampaignManager';
import BlogManager from './pages/executive/BlogManager';
import AccessControlManager from './pages/executive/AccessControlManager';
import PostsManager from './pages/executive/PostsManager';
import CalendarManager from './pages/executive/CalendarManager';
import DebugPortal from './pages/executive/DebugPortal';
import MembershipSignUp from './pages/MembershipSignUp';
import MembershipFees from './pages/MembershipFees';
import MembershipManager from './pages/executive/MembershipManager';

// Component to handle scroll restoration and run the IntersectionObserver for scroll animations
function RouteObserver() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to the top on navigation
    window.scrollTo(0, 0);

    // Toggle events-body class based on path to load the page background image
    const path = location.pathname;
    const isEventsBodyRoute = path.startsWith('/events') || path.startsWith('/calendar') || path.startsWith('/connect/unsubscribe') || path.startsWith('/executive') || path.startsWith('/membership-sign-up');
    
    if (isEventsBodyRoute) {
      document.body.classList.add('events-body');
    } else {
      document.body.classList.remove('events-body');
    }

    // Set document title based on path
    let pageTitle = 'Home';
    switch (path) {
      case '/':
        pageTitle = 'Home';
        break;
      case '/events':
        pageTitle = 'Events';
        break;
      case '/events/calgary-summer-cup':
        pageTitle = 'Calgary Summer Cup';
        break;
      case '/events/calgary-summer-cup/registration':
        pageTitle = 'Summer Cup Registration';
        break;
      case '/events/calgary-summer-cup/registration/success':
        pageTitle = 'Registration Success';
        break;
      case '/blog':
        pageTitle = 'Blog';
        break;
      case '/resources':
        pageTitle = 'Resources';
        break;
      case '/connect':
        pageTitle = 'Connect';
        break;
      case '/socials':
        pageTitle = 'Socials';
        break;
      case '/calendar':
        pageTitle = 'Calendar';
        break;
      case '/connect/unsubscribe':
        pageTitle = 'Unsubscribe';
        break;
      case '/join':
        pageTitle = 'Join UCDS';
        break;
      case '/join/welcome':
        pageTitle = 'Welcome';
        break;
      case '/void':
        pageTitle = 'Void';
        break;
      case '/void/discord':
        pageTitle = 'Discord Bot';
        break;
      case '/void/discord/terms-and-privacy':
        pageTitle = 'Discord Terms & Privacy';
        break;
      case '/executive':
        pageTitle = 'Executive Portal';
        break;
      case '/executive/roster':
        pageTitle = 'Roster Manager';
        break;
      case '/executive/ledger':
        pageTitle = 'Ledger Manager';
        break;
      case '/executive/email':
        pageTitle = 'Email Campaign Manager';
        break;
      case '/executive/blog':
        pageTitle = 'Blog Manager';
        break;
      case '/executive/access':
        pageTitle = 'Access Control Manager';
        break;
      case '/executive/posts':
        pageTitle = 'Posts Manager';
        break;
      case '/executive/calendar':
        pageTitle = 'Calendar Manager';
        break;
      case '/executive/debug':
        pageTitle = 'Debug Portal';
        break;
      case '/executive/membership':
        pageTitle = 'Membership Manager';
        break;
      case '/membership-sign-up':
        pageTitle = 'Membership Sign-Up';
        break;
      case '/membership-sign-up/fees':
        pageTitle = 'Membership Fees';
        break;
      default:
        if (path.startsWith('/executive/')) {
          pageTitle = 'Executive Manager';
        } else {
          pageTitle = 'UCDS';
        }
    }
    document.title = `UCDS | ${pageTitle}`;

    if (path === '/join') {
      document.documentElement.classList.add('join-page');
      document.body.classList.add('join-page');
    } else {
      document.documentElement.classList.remove('join-page');
      document.body.classList.remove('join-page');
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
        <Route path="/socials" element={<Socials />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/connect/unsubscribe" element={<Unsubscribe />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/welcome" element={<JoinWelcome />} />
        <Route path="/void" element={<Void />} />
        <Route path="/void/discord" element={<DiscordInstall />} />
        <Route path="/void/discord/terms-and-privacy" element={<DiscordTermsAndPrivacy />} />
        <Route path="/executive" element={<ExecutivePortal />} />
        <Route path="/executive/roster" element={<RosterManager />} />
        <Route path="/executive/ledger" element={<LedgerManager />} />
        <Route path="/executive/email" element={<EmailCampaignManager />} />
        <Route path="/executive/blog" element={<BlogManager />} />
        <Route path="/executive/access" element={<AccessControlManager />} />
        <Route path="/executive/posts" element={<PostsManager />} />
        <Route path="/executive/calendar" element={<CalendarManager />} />
        <Route path="/executive/debug" element={<DebugPortal />} />
        <Route path="/executive/membership" element={<MembershipManager />} />
        <Route path="/membership-sign-up" element={<MembershipSignUp />} />
        <Route path="/membership-sign-up/fees" element={<MembershipFees />} />
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
        <Mascot />
      </Router>
    </DialogProvider>
  );
}

export default App;


