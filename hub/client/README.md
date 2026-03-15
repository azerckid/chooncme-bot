# 🌌 Mogame Metaverse V2.0 (Client)

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![Three.js](https://img.shields.io/badge/Three.js-R3F-orange)
![Socket.io](https://img.shields.io/badge/Socket.io-Client-blue)

**Mogame Metaverse** is a web-based 3D multiplayer social platform built with modern web technologies. Users can explore a 3D world, interact with others in real-time, and communicate via a synchronized chat system.

This repository contains the **Client-side** application.

---

## ✨ Key Features

### 🕹️ Core Gameplay
- **3D Avatar Control**: Smooth third-person character movement using `WASD` and Mouse rotation.
- **Physics Engine**: Integrated `Cannon.js` for collision detection and realistic interactions.
- **RPG-Style Camera**: Smart camera system that follows the character without causing motion sickness or background distortion.

### 🌐 Multiplayer (Socket.io)
- **Real-time Synchronization**:
    - Multi-user position and rotation syncing with interpolation (Lerp) for smoothness.
    - Optimized network traffic using throttling (50ms update rate).
- **Identity System**:
    - Nickname entry at startup.
    - Visual name tags above characters (Teal for self, Grey for others).
- **Live Chat**:
    - Fully integrated chat system with real-time message broadcasting.
    - Distinction between "My Messages" (Right) and "Other's Messages" (Left).

### 🎨 Visuals & Environment
- **High-Fidelity Rendering**: Powered by React Three Fiber (R3F) and Drei.
- **Dynamic Lighting**: Interactive light controls and shadow casting.
- **Media Integration**: Fixed position video wall (mp4 texture) simulated as a virtual screen.
- **Modern UI**: Clean, glassmorphism-style HUD and overlay UI using Tailwind CSS.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Physics**: [React Three Cannon](https://github.com/pmndrs/use-cannon)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Networking**: [Socket.io Client](https://socket.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) (Icons)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Socket Server**: You need the `mogame2_server` running locally or remotely for multiplayer features to work.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mogame-metaverse-client.git
   cd mogame-metaverse-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory if you need to specify a custom socket URL (default is usually localhost:3001).
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Visit [http://localhost:3000](http://localhost:3000).

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **W A S D** | Move Character |
| **Mouse** | Rotate Camera / Character Direction |
| **Enter** | Focus Chat / Send Message |
| **Click** | Return Focus to Game (if lost) |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── 3d/                 # R3F 3D Components
│   │   ├── character/      # Player, OtherPlayer, Controls, Models
│   │   ├── environment/    # Plane, Lights, MoviePlane
│   │   └── interaction/    # Cubes, Interactive objects
│   └── ui/                 # 2D HUD overlays (Chat, Start Screen)
├── hooks/
│   ├── useKeyboard.ts      # Input handling logic
│   └── useSocket.ts        # Network event listeners
├── store/
│   └── useGameStore.ts     # Global state (Zustand)
└── lib/
    └── socket.ts           # Socket instance configuration
```

---

## ⚠️ Notes for Deployment

- This project relies on a **Socket.io Server**. When deploying this client to Vercel, ensure your `NEXT_PUBLIC_SOCKET_URL` points to your active backend server (e.g., deployed on Render, Railway, or EC2).
- Ensure `.backup_legacy` and `.env` files are not committed (handled by `.gitignore`).

---

**Developed by Antigravity (AI) & User**
