# 🤖 Duke AI Pro - Smart Teaching Assistant

**Duke AI Pro** is a modern, high-performance web application designed to help students and educators interact with PDF documents using Artificial Intelligence. Built with a focus on **premium UI/UX**, it allows users to chat with documents, generate summaries, and take interactive quizzes.

🚀 **Live Demo:** [https://ai-teaching-assistants.vercel.app/](https://ai-teaching-assistants.vercel.app/)

---

## ✨ Key Features

* **📄 Smart PDF Interaction:** Chat with any PDF document and get instant, context-aware answers.
* **🔍 Advanced OCR:** Automatically detects scanned PDFs or images and extracts text using Tesseract.js.
* **🧠 AI Summarization:** Generate structured, bulleted summaries of long documents in seconds.
* **❓ Interactive Quizzes:** Auto-generate multiple-choice questions (MCQs) from your PDF to test your knowledge.
* **🎨 Premium Glassmorphism UI:** A sleek dark-themed interface with smooth animations and responsive design.
* **🛡️ Secure Backend:** API keys are protected using Vercel Serverless Functions and Environment Variables.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
* **Libraries:** * [PDF.js](https://mozilla.github.io/pdf.js/) (Text Extraction)
    * [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR)
    * [Marked.js](https://marked.js.org/) (Markdown Rendering)
    * [Phosphor Icons](https://phosphoricons.com/) (UI Icons)
* **Backend:** Vercel Serverless Functions (Node.js)
* **AI Engine:** OpenRouter API (Nvidia Nemotron Model)

---

## 📁 Project Structure

```text
duke-ai-pro/
│
├── index.html           # Main UI Structure
├── css/
│   └── styles.css       # Premium Dark Theme & Animations
├── js/
│   └── script.js        # Frontend Logic & PDF/OCR Processing
└── api/
    └── ask.js           # Secure Vercel Serverless Function
    
