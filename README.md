# University of Calgary Debate Society (UCDS) Website

Welcome to the official repository for the University of Calgary Debate Society (UCDS) website. This is a highly aesthetic, responsive, and interactive static website built using HTML, Vanilla CSS, and custom JavaScript animations.

---

## Core Features

- **Responsive Design**: Custom layouts tailored for both desktop and mobile viewports with automatic redirection checks.
- **Glassmorphism & Micro-animations**: Modern visual system featuring smooth page fades, interactive element transformations, and responsive hover effects.
- **Calgary Summer Cup Hub**: A custom page containing debate-themed background art (gavels, trophies, speech bubbles), aesthetic fee deadlines, eligibility criteria, and a structured schedule.
- **Draft-Preserving Registration Form**: A multi-field registration form that automatically saves drafts to the user's local storage to prevent data loss. Upon successful submission, data is sent to a Google Spreadsheet Web App.
- **Inbox-Blending Confirmation Emails**: Custom HTML emails sent to registered participants, designed using system-level styles to adapt seamlessly to both light and dark themes.
- **Executive Profiles Carousel**: Swipeable/draggable team profiles for mobile interfaces, alongside expandable biographic drawers.
- **Audio Easter Eggs & Interaction**: Proximity-based background audio triggers and secret terminal endpoints (`/void/`) for hidden site interactions.

---

## Repository Structure

The project is structured logically into folders to make asset management straightforward:

```text
UCDS/
├── index.html                  # Desktop landing page
├── mobile.html                 # Mobile landing page (automatically redirected)
├── README.md                   # Project documentation
├── package.json                # Project dependencies and script declarations
│
├── audio/                      # Audio assets for interactive triggers
│   ├── blackhole_easteregg.mp3 # Easter egg audio
│   └── button_proximity_*.mp3  # Audio layers for interactive elements
│
├── blog/                       # News and announcements
│   ├── index.html              # Desktop blog layout
│   └── mobile.html             # Mobile blog layout
│
├── connect/                    # Executives profiles, links, calendar, and contact
│   ├── index.html              # Desktop connect page
│   └── mobile.html             # Mobile connect page
│
├── css/                        # Global style system
│   └── styles.css              # Centralized stylesheet (fades, glassmorphism, responsive grids)
│
├── events/                     # Events, workshops, and tournaments
│   ├── index.html              # Desktop events directory
│   ├── mobile.html             # Mobile events directory
│   │
│   └── calgary-summer-cup/     # Calgary Summer Cup 2026 Tournament
│       ├── index.html          # Desktop tournament landing page
│       ├── mobile.html         # Mobile tournament landing page
│       │
│       └── registration/       # Tournament Registration Flow
│           ├── index.html      # Desktop registration form
│           ├── mobile.html     # Mobile registration form
│           ├── success.html    # Desktop "You're Registered!" success page
│           ├── success-mobile.html # Mobile "You're Registered!" success page
│           └── GoogleAppsScript.txt # Apps Script backend code (handles tournament Sheets logging & emails)
│
├── join/                       # Membership application guides
│   ├── index.html              # Desktop membership overview
│   ├── mobile.html             # Mobile membership overview
│   ├── GoogleAppsScript-MailingList.txt # Apps Script newsletter backend code (handles subscriptions & dispatch)
│   │
│   └── welcome/                # Welcome page after joining
│       ├── index.html          # Desktop welcome banner
│       └── mobile.html         # Mobile welcome banner
│
├── photos/                     # Photography and design assets
│   ├── background*.jpg         # Background banner assets
│   ├── logo.jpg                # Standard UCDS emblem
│   ├── logo_seo.png            # Optimized meta-image for web crawler tags
│   └── *_footer.png            # Social channel icons
│
├── resources/                  # Debate guidelines, motions database, and guides
│   ├── index.html              # Desktop resources page
│   └── mobile.html             # Mobile resources page
│
├── scripts/                    # Scripts folder
│   ├── script.js               # Global site interactivity script (carousels, nav toggles, accordions)
│   └── sync-blog.js            # Node script for synchronizing blog content
│
└── void/                       # Interactive easter egg subpage
    └── index.html              # Hidden terminal interface
```

---

## 🛠️ Technical Details

### Styling System (`css/styles.css`)
- Purely built with Vanilla CSS for efficiency.
- Uses custom variables (`:root`) for color palette definitions (`#0b1a3a` deep navy, `#2563eb` vibrant blue, `#f8fafc` off-white).
- Features CSS animations (`fadeInPage`, `fadeInUpIntro`, `profileDropdownExpand`).

### Interactivity (`scripts/script.js`)
- **Responsive Redirects**: Runs immediately in the `<head>` of HTML files to check `navigator.userAgent` and route visitors to desktop/mobile equivalents.
- **Accordions**: Smooth biographic expansions using height/opacity transitions.
- **Carousel Indicators**: Dot navigation for team sliders on touch screens.
- **Newsletter Modals**: Triggers modern custom modal popups submitting dynamically via AJAX to the Google Sheets backend.

### Form Processing & Apps Script Backends
- **Tournament Registration**: Located in `/events/calgary-summer-cup/registration/`. The Google Apps Script template (`GoogleAppsScript.txt`) programmatically parses submission values and delivers formatted light/dark-mode adaptive email confirmations to participants.
- **Mailing List Subscriptions**: Located in `/join/`. The Google Apps Script template (`GoogleAppsScript-MailingList.txt`) handles storing subscriber details in a separate spreadsheet, managing opt-outs (unsubscribing) via click links, and dispatching newsletter campaigns directly from Google Sheets.

---

## 🚀 Getting Started

### Local Development
1. Open this repository directory inside an editor of your choice (such as VS Code).
2. Start a local static file server (for example, using the **Live Server** extension in VS Code) or simply double-click [index.html](file:///f:/Moicke/Desktop/General/UCDS/Ucds Website/UCDS/index.html) to view it in your browser.

### Blog Synchronization
A helper script is provided to synchronize blog content:
```bash
npm install
npm run sync-blog
```
This executes `node scripts/sync-blog.js` to refresh items inside the blog folder.
