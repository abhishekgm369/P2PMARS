# DropSpace 🌲

DropSpace is a premium, browser-to-browser P2P file delivery network designed with a warm, organic Nordic Minimalist aesthetic. It establishes instant WebRTC channels directly between users, bypassing cloud servers completely to stream files of any size with cryptographic safety.

---

## 🌐 Live Demo

Try the application live:
* **Live Web App:** [https://p2pmars.vercel.app](https://p2pmars.vercel.app)
* **Backend API Health Check:** [https://p2pmars-backend-hmqx.onrender.com/health](https://p2pmars-backend-hmqx.onrender.com/health)

---

## 💡 Core Engine & Architecture

* **Zero-Server Direct Browser Streams:** Files stream peer-to-peer using WebRTC Data Channels. Senders and receivers transfer bytes directly with zero cloud storage involved, ensuring complete privacy.
* **E2E Integrity Validation (SHA-256):** Computes cryptographic hashes in the browser (via Web Crypto APIs) before sending, then verifies it on reception to guarantee 100% byte-perfect transfers.
* **Warm Nordic Minimalist Aesthetic:** Designed around soft clay components, forest greens, terracotta alerts, and a clean alabaster canvas to create a cozy, premium workspace.
* **Intelligent Upload Sandbox:** Smart drag-and-drop mechanics built using `react-dropzone` that pre-filters unzippable directories, guards against empty files, and blocks items over 100MB to preserve memory.
* **Decentralized Signaling:** Backend uses Socket.io solely to hand off connection data (SDP offers/answers) and manage user rooms. Senders can spin up rooms that self-destruct upon disconnect to prevent ghost sessions.
* **Tactile Metric Feeds:** Modern activity monitor tables showing real-time MB/s bandwidth rates, circular file progress cards, and transfer history.

---

## 🛠️ Stack Overview

### Frontend Interface
* **Core:** React 19 (Vite bundler)
* **Design:** Tailwind CSS + Lucide Icons + Outfit/Plus Jakarta Sans Typography
* **P2P Channeling:** Native WebRTC (`RTCPeerConnection` + `RTCDataChannel`)
* **Navigation:** React Router v7

### Signaling Backend
* **Runtime:** Node.js (ES Modules) + Express
* **Signaling:** Socket.io
* **Storage:** MongoDB (via Mongoose ORM)
* **Safety:** JWT (JSON Web Tokens) & bcryptjs hashing

---

## 🚀 Setting Up Locally

### Prerequisites
* Node.js v18 or newer
* MongoDB instance (Local community server or Atlas Cloud URI)

### Installation & Run

1. **Signaling Server**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=8000
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=any_long_random_string
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```
   Launch the server:
   ```bash
   npm run dev
   ```

2. **Web Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env.local` file inside the `frontend/` directory:
   ```env
   VITE_BACKEND_URL=http://localhost:8000
   ```
   Launch the development server:
   ```bash
   npm run dev
   ```

3. **Try It Out**
   Open your browser to `http://localhost:5173`

---

## 🛡️ Security Posture
All file traffic is encrypted browser-to-browser via DTLS (Datagram Transport Layer Security) inside WebRTC. Senders and receivers remain completely private, and files never rest on external storage, mitigating any risk of database leakage or middleman snooping.
