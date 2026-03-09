# Browser Fingerprinting Demo

A single-page educational project that demonstrates what information JavaScript can collect from users who simply click a link. This project reveals the extensive data websites can gather for tracking, analytics, or access control purposes.

## What This Project Does

When a user visits this page, it automatically collects comprehensive browser and device information using only client-side JavaScript. This demonstrates that:

- **Any website can collect this data** without special permissions
- **99% of web users** are vulnerable since JavaScript is enabled by default
- **Even Tor users** are exposed if JavaScript isn't disabled
- **Website owners receive this data** on their servers from every visitor

## Information Collected

### Browser & System Information
- User Agent string
- Platform and operating system
- Hardware capabilities (CPU cores, memory)
- Java status
- Do Not Track preference

### Screen & Display
- Screen resolution and available space
- Color depth and pixel depth
- Window dimensions
- Device pixel ratio

### Localization
- Preferred language
- All supported languages
- Timezone
- Local time

### Network & Location
- IP address
- Approximate geolocation (city, region, country)
- ISP information
- Coordinates

### Canvas Rendering
- Hidden canvas image data (unique per GPU/OS/font renderer)

### GPU & WebGL
- GPU vendor and renderer model
- WebGL version and shading language
- Max texture/viewport sizes and precision formats
- Supported WebGL extensions

### Audio Processing
- OfflineAudioContext oscillator output samples
- Audio stack processing characteristics

### Installed Fonts
- Detected fonts from a list of ~60 common and uncommon fonts
- Font count

### WebRTC Local IP
- Local/private IP addresses discovered via RTCPeerConnection
- Works even behind VPNs

*Note: IP-based geolocation requires an API token from [ipinfo.io](https://ipinfo.io)*

## The 17-Hash Tracking System

Instead of creating a single fingerprint hash (which changes when users modify any setting), this project generates **seventeen independent hashes** for robust tracking:

1. **User Agent** - Browser and version characteristics
2. **Platform** - Operating system platform
3. **Do Not Track** - User tracking preference
4. **Java Enabled** - Java support status
5. **Hardware Concurrency** - Number of logical CPU cores
6. **Device Memory** - Approximate device RAM
7. **Screen Properties** - Screen resolution and color depth
8. **Language** - Primary browser language
9. **Languages List** - All accepted languages
10. **Window Size** - Browser window dimensions and pixel ratio
11. **Timezone** - Client's configured timezone
12. **IP Location** - IP address and server-matched geolocation
13. **Canvas Element** - Hidden canvas rendering output (GPU/OS-specific)
14. **WebGL** - GPU model, driver, rendering parameters
15. **Audio Context** - OfflineAudioContext processing characteristics
16. **Fonts Installed** - Set of installed system fonts detected via width measurement
17. **WebRTC Local IPs** - Local/private IP addresses via ICE candidates

### Why Multiple Hashes?

If a user tries to evade tracking by:
- Using a VPN (changes IP) → Other 16 hashes remain the same
- Changing user agent → Other 16 hashes remain the same
- Resizing the browser window → Other 16 hashes remain the same
- Spoofing canvas → WebGL, audio, fonts, and 13 others still match
- Disabling WebRTC → Canvas, audio, device, and 14 others still match

This multi-hash approach allows websites to still identify users even when they attempt to mask their identity by changing individual attributes.

## Data Storage (MongoDB)

All fingerprint data is persisted in a **MongoDB** database. Each visit is stored as a document containing:

- **Timestamp** — when the visit occurred
- **User ID** — a 4-digit ID derived from mathematically hashing all 17 independent fingerprints.
- **Network ID** — a 4-digit ID derived securely from the IP, Timezone, and WebRTC fingerprint.
- **Fingerprints** — all 17 individual hash values stored independently.
- **Info** — raw collected data (IP, location, user agent, screen, fonts, WebGL, audio, WebRTC, etc.)

## Admin Dashboard

A real-time admin dashboard is available at **`/admin`** with the following features:

- **JWT Authentication** — login with your admin key to receive a time-limited token
- **Stats Overview** — total visits, unique users, unique IPs, top country
- **Visits Over Time Chart** — line chart of daily visits and unique users (last 30 days)
- **Browser Distribution Chart** — doughnut chart of browser types
- **World Map** — interactive Leaflet map with visitor location markers  
- **Visitors Table** — paginated, searchable table of all visits
- **User Detail Modal** — view full fingerprint data, device info, fonts, GPU, WebRTC IPs, and visit timeline for any user
- **Cross-Session Matching** — compare a visit's 17 hashes against all other users to find similar visitors with confidence scoring

## Setup

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** running locally or a remote MongoDB URI

### Installation

1. Clone this repository
```bash
git clone https://github.com/Professor606/web-fingerprinting.git
cd web-fingerprinting
```

2. Create and configure your `.env` file:
```bash
touch .env
```

3. Add the following variables to `.env`:
```env
# Required: Get a free token from https://ipinfo.io/signup
IPINFO_TOKEN=your_ipinfo_token

# Server port (default: 3000)
PORT=3000

# MongoDB connection URI (default: mongodb://localhost:27017/fingerprint)
MONGO_URI=mongodb://localhost:27017/fingerprint

# Admin dashboard password
ADMIN_KEY=your_secure_admin_key

# JWT secret for admin auth (use a long random string)
JWT_SECRET=your_random_jwt_secret_here

# JWT token expiration (default: 8h)
JWT_EXPIRES_IN=8h
```

4. Install dependencies
```bash
npm install
```

5. Make sure MongoDB is running:
```bash
# If using local MongoDB:
sudo systemctl start mongod

# Or with Docker:
docker run -d -p 27017:27017 --name mongo mongo:latest
```

6. Start the server
```bash
npm run start
```

7. Open in your browser:
- **Fingerprint collector:** `http://localhost:3000`
- **Admin dashboard:** `http://localhost:3000/admin`

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/` | GET | — | Serves the fingerprint collector page |
| `/api/ipinfo` | GET | — | Proxies IP geolocation from ipinfo.io |
| `/api/data` | POST | — | Receives and stores fingerprint data |
| `/admin` | GET | — | Serves the admin dashboard UI |
| `/api/admin/login` | POST | — | Authenticate with admin key, returns JWT |
| `/api/admin/stats` | GET | JWT | Dashboard statistics overview |
| `/api/admin/visits` | GET | JWT | Paginated visit list (supports `?search=`) |
| `/api/admin/user/:id` | GET | JWT | Full visit history for a specific user |
| `/api/admin/match/:id` | GET | JWT | Cross-session hash comparison |
| `/api/admin/locations` | GET | JWT | Aggregated visitor locations for map |
| `/api/admin/timeline` | GET | JWT | Daily visit/user counts for chart |

## Defense Against Tracking

To minimize fingerprinting:
- Use privacy-focused browsers (Tor Browser with JavaScript disabled, Brave)
- Enable fingerprinting protection in browser settings
- Use browser extensions that spoof fingerprints
- Disable JavaScript on sensitive sites
- Use multiple browser profiles for different activities

## Use Cases (Educational)

Understanding browser fingerprinting is important for:
- **Security professionals** testing website vulnerabilities
- **Privacy researchers** studying tracking techniques
- **Web developers** implementing ethical analytics
- **Users** learning about their digital footprint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- IP geolocation data provided by [ipinfo.io](https://ipinfo.io)
- Inspired by privacy research and electronic frontier advocacy

## Disclaimer

This project is intended for **educational purposes only**. It demonstrates browser fingerprinting techniques to raise awareness about online privacy. Users should not use this tool to track individuals without their knowledge or consent. Always respect privacy laws and regulations in your jurisdiction.

---

**Remember:** Protect privacy, not violate it.
