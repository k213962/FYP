# 🚨 EmergiVoice

**EmergiVoice** is a real-time emergency response mobile application built using **React Native (Expo SDK 53)** for the frontend and **Node.js + MongoDB** for the backend. It provides secure authentication, live audio/video features, location tracking, mobile-first UI, and intelligent assistance powered by fine-tuned large language models (LLMs).

---

## 📲 Features

- 🔐 Secure JWT Authentication
- 🗺️ Live Map Integration
- 🎤 Audio & Video Support (expo-av)
- 📍 Real-time Location Sharing
- 🤖 AI Assistant Support with Fine-Tuned LLMs
- 🧠 Fine-tuning on LLMs:
  - Meta **LLaMA 3.2 3B Instruct**
  - **Mistral 7B**
  - **Qwen 2.5**
  - **Microsoft Phi-2**
  - **DeepSeek-Unsloth-8B**
  - **Gemma-3 (Unsloth)**
- 🧭 Smooth Navigation (expo-router)
- ☁️ Ngrok for Backend Tunneling (Dev)
- 📦 Scalable and Maintainable Architecture

---

## 🛠️ Tech Stack

| Layer      | Technology                                               |
|------------|----------------------------------------------------------|
| Frontend   | React Native (Expo SDK 53), React Navigation, Axios      |
| Backend    | Node.js, Express.js                                      |
| Database   | MongoDB, Mongoose                                        |
| Auth       | JWT (jsonwebtoken), bcrypt                               |
| Media      | expo-av, expo-image-picker                               |
| Maps       | react-native-maps, expo-location                         |
| AI/LLMs    | Fine-tuned models (LLaMA 3.2, Mistral 7B, etc.) via API  |
| Utilities  | dotenv, express-validator, cors, Ngrok                   |

---

## 📱 Frontend - React Native (Expo)
## ✅ Installation

Install my-project with npm

```bash
  npm install my-project
  cd my-project
```
    Run these commands in your frontend directory:

```bash
npm install react-native-maps expo-router axios --legacy-peer-deps

npm install expo@~52.0.46 expo-constants@~17.0.8 expo-font@~13.0.4 @types/react@~18.3.12 jest-expo@~52.0.6 --legacy-peer-deps

npm uninstall axios --legacy-peer-deps

npm install expo@~52.0.46 react@18.3.1 react-dom@18.3.1 react-native@0.76.9 --legacy-peer-deps

npm install @expo/config-plugins@~9.0.0 @react-native-async-storage/async-storage@1.23.1 @react-native-picker/picker@2.9.0 expo-av@~15.0.2 expo-blur@~14.0.3 expo-haptics@~14.0.1 expo-image-picker@~16.0.6 expo-linking@~7.0.5 expo-location@~18.0.10 expo-splash-screen@~0.29.24 expo-status-bar@~2.0.1 expo-symbols@~0.2.2 expo-system-ui@~4.0.9 expo-web-browser@~14.0.2 --legacy-peer-deps

npm install react-native-gesture-handler@~2.20.2 react-native-reanimated@~3.16.1 react-native-safe-area-context@4.12.0 react-native-screens@~4.4.0 react-native-web@~0.19.13 react-native-webview@13.12.5 axios@1.3.5 --legacy-peer-deps

npm install axios@1.3.5 --legacy-peer-deps

npx expo install expo-file-system

npm install expo-av@latest

npm install --save-dev @types/expo-av
```






## ▶️ Run The App
```bash
npx expo start
Or
npx expo start --clear --> Clearing all the Caches
```
## 🖥️ Backend - Node.js + MongoDB

## ✅ Installation

Navigate to the backend directory and install dependencies:
```bash
npm install express mongoose dotenv bcrypt jsonwebtoken express-validator cors --legacy-peer-deps
```

## ▶️ Run the Server

```bash
npx nodemon
```

## 🌐 Ngrok (for Tunneling API)
To expose your local backend to the internet (useful for mobile testing):
```bash
npm install ngrok
ngrok http 4000
```
## 🧠 AI Assistant - LLM Integration

EmergiVoice supports intelligent assistant features powered by APIs or self-hosted fine-tuned LLMs:

  -  Meta LLaMA 3.2 3B Instruct

  -  Mistral 7B

  -  Qwen 2.5

  -  Microsoft Phi-2

  -  DeepSeek-Unsloth-8B

  -  Gemma-3 (Unsloth)

You can host these models using platforms like:

  - Hugging Face Inference Endpoints

  - Modal/Replicate/RunPod

  - Local inference (with tools like text-generation-webui or llama.cpp)

  - FastAPI + Docker deployment


## 📁 Project Structure
```bash
EmergiVoice/
├── frontend/               # React Native (Expo SDK 53)
│   └── ...
├── backend/                # Node.js + Express + MongoDB
│   └── ...
├── .env                    # Environment variables
└── README.md
```

## 🔐 Authentication Flow

  - User signs up/logs in via mobile

  - Credentials hashed with bcrypt

  - JWT issued and stored locally

  - All protected routes validate token

## 📞 Media & Maps

  - Maps: react-native-maps, expo-location

  - Media: expo-av for audio/video

  - File System: expo-file-system for storing media locally

## 📌 Notes

  - This project uses Expo SDK 53, which is not compatible with older plugins. Always use --legacy-peer-deps when installing.

  - Ensure MongoDB is running locally or use MongoDB Atlas for production.

  - Ngrok is important and helpful during mobile development for testing API requests.

  - LLMs can be integrated using APIs or local hosting with efficient inference runtimes.


## Acknowledgements
  Thanks to the open-source community, Hugging Face, Meta AI, and Expo for building tools that empower developers and improve lives.
 
---
``` text
Let me know if you'd like help setting up API integration for these LLMs or generating an architecture diagram for visual explanation.
```

