# TiffinSplit — Design & Color System Specification

## 🎨 Color Palette Overview

TiffinSplit uses a custom-tailored color system configured for maximum contrast, modern glassmorphism aesthetics, and instant readability across both Dark and Light themes.

---

### 1. 🌙 Dark Theme Palette

Designed with deep forest teal tones and high-contrast crisp white typography.

| Token | Hex Value | RGB Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#092328` | `rgb(9, 35, 40)` | Main app body & canvas background |
| **Card / Surface** | `#0F3137` | `rgb(15, 49, 55)` | Elevating card container surfaces |
| **Surface Muted** | `#12544F` | `rgb(18, 84, 79)` | Secondary panels, table headers, code boxes |
| **Borders** | `#1F6861` | `rgb(31, 104, 97)` | Subtle card, input & table borders |
| **Primary Accent** | `#2A835F` | `rgb(42, 131, 95)` | Primary CTAs, active badges, key highlights |
| **Secondary Accent**| `#8BBB92` | `rgb(139, 187, 146)` | Focus rings, text highlights, success badges |
| **Text Font** | `#F4F9F6` | `rgb(244, 249, 246)`| **White / Whitish shade for maximum contrast** |
| **Text Muted** | `#A8D1C4` | `rgb(168, 209, 196)`| Secondary labels, subtitles, dates |

---

### 2. ☀️ Light Theme Palette

Designed with soft mint sage backgrounds and bold high-visibility black/dark charcoal font everywhere.

| Token | Hex Value | RGB Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#E6F2DD` | `rgb(230, 242, 221)`| Soft mint cream application canvas |
| **Card / Surface** | `#FFFFFF` | `rgb(255, 255, 255)`| Pure white elevated cards |
| **Surface Muted** | `#B1D3B9` | `rgb(177, 211, 185)`| Light sage containers & header backgrounds |
| **Borders** | `#88BDA4` | `rgb(136, 189, 164)`| Crisp sage card & table borders |
| **Primary Accent** | `#659287` | `rgb(101, 146, 135)`| Deep sage teal primary buttons & highlights |
| **Text Font** | `#0A1412` | `rgb(10, 20, 18)` | **Solid black / dark charcoal font everywhere** |
| **Text Muted** | `#1A2D28` | `rgb(26, 45, 40)` | High-contrast secondary labels & captions |

---

## 🚀 Key Features

1. **Fast Entry ⚡ Mode**:
   - Quick raw text input format e.g., `01 Aug m K S SB`
   - Real-time line-by-line validation for invalid calendar dates (e.g. `32 Aug`, `30 Feb`), leap year checks, and unrecognized friend short codes.

2. **Automated Bill Email Statements & Standalone Views**:
   - Integrated Gmail SMTP email dispatch with dynamic embedded UPI QR codes (`api.qrserver.com`).
   - Clean, standalone unauthenticated statement pages at `/invoices/view/:invoiceId` (without topbar or sidebar).

3. **UPI One-Tap Payments**:
   - Integrated PhonePe, Google Pay, and Paytm payment buttons (`upi://pay?pa=...`).
