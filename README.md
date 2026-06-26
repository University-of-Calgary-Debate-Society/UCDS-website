# UCDS Website (University of Calgary Debate Society)

Welcome to the official repository for the **University of Calgary Debate Society (UCDS)** website and executive administration dashboard. This platform serves public guests (memberships, registrations, resources, interactive calendar) and provides a secure, fully featured portal for executive officers to manage operations.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v20+ recommended).

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Running Locally
To launch the hot-reloading local development server:
```bash
npm run dev
```
Open your browser and navigate to the printed local port (typically `http://localhost:5173/`).

### Building for Production
Vite compiles and minifies all assets into the `dist/` directory:
```bash
npm run build
```

---

## 🛠️ Technology Stack
* **Frontend Core**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
* **Routing**: [React Router 7](https://reactrouter.com/) (configured in Hash routing mode for smooth GitHub Pages integration)
* **Database & Auth**: [Firebase v12 client SDK](https://firebase.google.com/) (using Firestore for real-time document sync and Firebase Auth for secure executive access)
* **Styling**: Modern, premium vanilla CSS with custom HSL variables, fluid micro-animations, glassmorphism containers, and full responsive layout grids.
* **Backend Utilities**: Python (contained in the `backend/` directory) powering a Discord integration bot, email campaign worker script, and automated ledger operations.

---

## 📂 Repository Structure

```
├── .github/workflows/   # Github CI/CD workflows (deploys built site to GitHub Pages)
├── backend/             # Python-based utility microservices
│   ├── discord_bot.py      # UCDS Discord server moderation & integration bot
│   ├── email_worker.py     # Worker script processing transactional newsletter broadcasts
│   └── requirements.txt    # Python package dependencies
├── public/              # Static public assets (images, CNAME file, seo icons)
│   ├── photos/             # Photos, logos, and SEO assets (e.g. seo.png)
│   └── favicon.svg         # SVG fallback site icon
├── src/                 # React frontend application code
│   ├── assets/             # Static style vectors and custom SVG icons
│   ├── components/         # Reusable global layout elements (Header, Footer)
│   ├── context/            # React Context stores (e.g. DialogContext for custom popups)
│   ├── pages/              # Application pages and route elements
│   │   ├── executive/         # Secure management managers (Roster, Ledger, Calendar, Blog)
│   │   ├── void/              # Terms of service and Discord bot installation views
│   │   ├── Blog.jsx           # Public blog articles feed
│   │   ├── Calendar.jsx       # Interactive multi-view event schedule
│   │   ├── Connect.jsx        # Public mailing list subscription landing
│   │   ├── Events.jsx         # Tournaments page (Calgary Summer Cup overview)
│   │   ├── Home.jsx           # Main home splash page
│   │   ├── Join.jsx           # Interactive proximity-reactive club sign-up
│   │   ├── MembershipSignUp.jsx # Membership portal registration form
│   │   └── Registration.jsx   # Calgary Summer Cup registration sheets
│   ├── styles/             # Modular CSS stylesheets
│   ├── utils/              # Helper libraries (date formatters, calendar math)
│   ├── App.jsx             # Main routing registry, scroll observer, and tab title controller
│   └── main.jsx            # React root mount bootstrapper
├── index.html           # Main entry point template
├── vite.config.js       # Vite server build pipelines configuration
└── package.json         # Project npm manifest configuration
```

---

## 🔑 Firebase Configuration
The application connects to Firestore using client variables initialized in `src/firebase.js`. 

To run against a local mock project or customize credentials, override the defaults by creating a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Firestore Security Rules
Ensure your cloud instance Firestore Security Rules are published correctly to allow public registrations and member lookups. Detailed settings can be found in the workspace artifact:
👉 **[firebase_setup_guide.md](file:///C:/Users/busin/.gemini/antigravity-ide/brain/48f9446c-eb02-4418-9044-7afa5012ec0c/firebase_setup_guide.md)**
