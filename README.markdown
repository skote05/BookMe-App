# BookMe

**BookMe** is a full-stack ride fare comparison app. Instantly compare estimated fares for popular ride-hailing services (Uber, Ola, Rapido, BlaBlaCar) and your own personal vehicle using a static formula-based calculation (not real-world dynamic pricing or API integrations). Features interactive mapping, geocoding, and secure user accounts. Built with Node.js, Express, MongoDB, and React Native (Expo).

---

## 🖼️ App Features

- 💡 Modern authentication with JWT
- 🗺️ Interactive map UI: search, route, and markers
- 📍 Smart location search (OpenStreetMap/Nominatim)
- 🚕 Static formula-based fare estimation for Uber, Ola, Rapido, BlaBlaCar (bike, auto, cab...)
- 🚗 Personal vehicle cost estimation (mileage/fuel selection)
- 🧑 Profile and vehicle management
- 📱 Beautiful, responsive UI (React Native + Expo)
- 🔒 Security best practices (password hashing, validation, helmet, rate limiting)
- 🌍 Works on both Android and iOS

---

## 🏗️ Project Structure

```
bookme/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── ...etc
│
├── frontend/
│   ├── assets/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...etc
│   ├── App.js
│   └── ...etc
│
├── README.md
├── LICENSE
```

---

## 🚀 Quick Start

### 1. **Clone the repository**

```bash
git clone https://github.com/skote05/BookMe-App.git
cd BookMe-App
```

---

### 2. **Backend Setup**

```bash
cd backend
npm install
```

**Create a `.env` file in the `backend/` directory with the following (edit values as needed):**

```
MONGODB_URI=mongodb://localhost:27017/bookme
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=1d
JWT_COOKIE_EXPIRE=30
PORT=3000
```

#### **Run Backend**

- **Development (with auto-reload):**

```bash
npm run dev
```

- **Production:**

```bash
npm start
```

---

### 3. **Frontend Setup**

You'll need [Node.js](https://nodejs.org/) and [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`).

```bash
cd ../frontend
npm install
```

#### **Run Frontend**

```bash
npm start
```

- This will start the Expo Metro Bundler. Scan the QR code with the Expo Go app on your Android/iOS device **(both device and computer must be on the same network)**.

---

### 4. **Configure API Endpoint**

By default, the frontend expects the backend to be running at:

```
http://192.168.1.3:3000/api
```

> **IMPORTANT:**  
> Change this IP address in `frontend/src/services/api.js` to match your backend's actual IP (e.g., `http://localhost:3000/api` for local emulator, or your LAN IP for mobile testing).

---

## 🛠️ Major Technologies Used

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, helmet, cors, express-validator, dotenv
- **Frontend:** React Native, Expo, react-navigation, react-native-paper, axios, AsyncStorage, MapView, expo-location
- **External APIs:** OpenStreetMap/Nominatim (geocoding), OSRM (directions/routing)

---

## ✨ Features Roadmap

- Password reset and change support
- Multiple vehicles per user
- Real ride-booking integrations
- Push notifications

---

## 💬 Common Commands Reference

| Purpose             | Command                                           |
|---------------------|--------------------------------------------------|
| Install all deps    | `npm install` (in frontend/ or backend/)         |
| Run backend (dev)   | `cd backend && npm run dev`                      |
| Run backend (prod)  | `cd backend && npm start`                        |
| Run frontend        | `cd frontend && npm start`                       |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.