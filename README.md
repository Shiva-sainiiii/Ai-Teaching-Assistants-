# 🤖 AI Powered Learning Platform

**Ai Teaching Assistant** is a modern, high-performance web application designed to help students and educators interact with PDF documents using Artificial Intelligence.  

Now upgraded into a **data-driven learning platform**, it not only enables document interaction but also tracks user progress, analyzes learning behavior, and visualizes performance through a smart dashboard.

🚀 **Live Demo:** https://ai-teaching-assistants.vercel.app/

---

## ✨ Key Features

### 📄 AI Document Interaction
Chat with any PDF and get instant, context-aware answers powered by AI.

### 🔍 Advanced OCR Support
Automatically detects scanned PDFs or images and extracts text using Tesseract.js.

### 🧠 Smart AI Summarization
Generate structured, easy-to-read summaries in seconds.

### ❓ Interactive Quiz System
Auto-generate MCQs from your PDF and test your understanding.

### 📊 Smart Dashboard (NEW 🚀)
Track your learning with real-time analytics:
- 📚 PDFs uploaded count  
- 🧠 Topics explored  
- ⏱ Study time tracking  
- 📈 Quiz performance graph  

### 🎨 Premium UI/UX
Glassmorphism-based modern dark theme with smooth animations and responsive design.

### 🛡️ Secure Backend
API keys are protected using Vercel Serverless Functions and environment variables.

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3 (Glassmorphism UI)
- Vanilla JavaScript

**Libraries:**
- PDF.js → Text extraction from PDFs  
- Tesseract.js → OCR for scanned PDFs/images  
- Marked.js → Markdown rendering  
- Phosphor Icons → UI icons  

**Backend:**
- Vercel Serverless Functions (Node.js)

**AI Engine:**
- OpenRouter API (Nvidia Nemotron Model)

---

## 📁 Project Structure

```text
duke-ai-pro/
│
├── index.html              # Main UI (PDF, Chat, Summary, Quiz)
├── dashboard.html          # 📊 Smart Dashboard (Analytics Page)
│
├── css/
│   └── styles.css          # Premium Dark Theme & Animations
│
├── js/
│   ├── script.js           # Main App Logic (PDF, OCR, Chat, Quiz, Tracking)
│   └── dashboard.js        # Dashboard Data & Chart Logic
│
├── api/
│   └── ask.js              # Secure Vercel Serverless Function
