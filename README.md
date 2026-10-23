# InvoiceDesk 🧾

A clean, fast desktop invoice generator for freelancers. Built with Electron.

---

## Features
- Create, edit, save invoices locally (no cloud, no subscription)
- PDF export with one click
- Live invoice preview as you type
- Line items with qty, rate, auto totals
- Tax & discount support
- Multi-currency (USD, EUR, GBP, CAD, AUD, CHF, JPY, RSD)
- Invoice status tracking (Draft → Sent → Paid), overdue detection
- Duplicate invoices, sender details remembered between invoices
- Client directory built automatically
- Dashboard with revenue stats
- Search, filter & sort invoices
- JSON backup of all your data
- Dark mode (follows your system theme)

---

## Keyboard shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + N` | New invoice |
| `Ctrl/Cmd + S` | Save invoice |
| `Ctrl/Cmd + P` | Export PDF |
| `Ctrl/Cmd + F` | Search invoices |
| `Enter` (last line item) | Add a line item |
| `Esc` | Back / close dialog |

---

## How to build the .exe (Windows installer)

### Prerequisites
- Node.js 18+ → https://nodejs.org
- Git (optional)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build Windows installer (.exe)
npm run build:win

# Output will be in:  dist/InvoiceDesk Setup 1.1.0.exe  (installer)
#                     dist/InvoiceDesk 1.1.0.exe         (portable, no install needed)
```

### Build for other platforms
```bash
npm run build:mac      # macOS .dmg
npm run build:linux    # Linux .AppImage
npm run build:all      # All platforms at once
```

---

## Run in dev mode (no build)
```bash
npm install
npm start
```

---

## Project structure
```
invoicedesk/
├── main.js          # Electron main process (window, IPC, PDF export)
├── preload.js       # Secure bridge between main and renderer
├── src/
│   ├── index.html   # The full app UI (HTML/CSS/JS, no framework needed)
│   └── print.html   # PDF print template
├── assets/
│   ├── icon.png     # App icon (256x256 PNG)
│   ├── icon.ico     # Windows icon
│   └── icon.icns    # macOS icon
└── package.json
```
