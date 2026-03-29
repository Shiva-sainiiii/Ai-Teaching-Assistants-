// File: js/script.js

let pdfText = "";

// ⏱️ STUDY TIME TRACKER START
let startTime = Date.now();

// --- INITIALIZATION ---
if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true });
}

// --- EVENT LISTENERS ---

// Page Navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const pageId = btn.getAttribute("data-page");
        showPage(pageId, btn);
    });
});

// File Upload
document.getElementById("pdfUpload").addEventListener("change", handleFileUpload);

// Chat Send Button
document.getElementById("sendBtn").addEventListener("click", sendMsg);

// Enter key for Chat
document.getElementById('input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMsg();
});

// Summary Button
document.getElementById("summaryBtn").addEventListener("click", generateSummary);

// Quiz Button
document.getElementById("quizBtn").addEventListener("click", generateQuiz);

// Summary Download Button
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
        const summaryContent = document.getElementById("summaryResult").innerHTML;
        
        // Ek temporary iframe/window create karke print prompt trigger karenge
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Duke AI Pro - Summary</title>');
        
        // PDF styling clean rakhte hain
        printWindow.document.write(`
            <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                h1 { color: #2563eb; }
                p { line-height: 1.6; }
                ul, ol { padding-left: 20px; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>PDF Summary by Duke AI</h1><hr style="border:0.5px solid #ccc; margin-bottom:20px;">');
        printWindow.document.write(summaryContent);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        printWindow.print();
    });
}


// --- CORE FUNCTIONS ---

// 📄 SWITCH PAGE logic
function showPage(pageId, btnElement) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    btnElement.classList.add("active");

    if (pageId === 'chatPage') {
        scrollToBottom();
    }
}

// 📈 PDF COUNT FUNCTION (Reusable)
function increasePDFCount() {
    let pdfCount = localStorage.getItem("pdfCount") || 0;
    pdfCount++;
    localStorage.setItem("pdfCount", pdfCount);
}

// 📄 PDF & IMAGE PROCESSING
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const statusDiv = document.getElementById("uploadStatus");
    const uploadText = document.getElementById("uploadText");

    uploadText.innerText = "Processing file...";
    statusDiv.style.display = "none";

    try {
        if (file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = async function () {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                pdfText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    let page = await pdf.getPage(i);
                    let content = await page.getTextContent();
                    let strings = content.items.map(item => item.str);
                    pdfText += strings.join(" ") + "\n\n";
                }

                // Fallback to OCR if PDF is scanned
                if (!pdfText.trim()) {
                    uploadText.innerText = "Scanned PDF detected... using OCR...";
                    pdfText = await extractTextFromScannedPDF(pdf);
                }

                uploadText.innerText = file.name;
                statusDiv.style.display = "flex";

                // ✅ COUNT INCREASE
                increasePDFCount();
            };
            reader.readAsArrayBuffer(file);

        } else if (file.type.startsWith("image/")) {
            uploadText.innerText = "Extracting text from image...";
            pdfText = await extractTextFromImage(file);
            uploadText.innerText = file.name;
            statusDiv.style.display = "flex";

            // ✅ COUNT INCREASE
            increasePDFCount();

        } else {
            alert("Unsupported file type!");
        }
    } catch (err) {
        console.error(err);
        uploadText.innerText = "Error processing file";
    }
}

// 💬 CHAT LOGIC
async function sendMsg() {
    const input = document.getElementById("input");
    let text = input.value.trim();

    if (!text) return;

    // ✅ SAVE TOPIC
    saveTopic(text);

    if (!pdfText) {
        addBotMessage("Please upload a PDF first in the Document tab.");
        input.value = "";
        return;
    }

    addUserMessage(text);
    input.value = "";

    const botMsgDiv = addTypingIndicator();

    const context = getRelevantText(pdfText, text);
    const fullPrompt = `PDF Context:\n${context}\n\nUser Question: ${text}`;

    const reply = await callAI(fullPrompt);
    botMsgDiv.innerHTML = marked.parse(reply);
    
    // Copy button chat ke AI response me add kar rahe hain
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `<i class="ph ph-copy"></i> Copy`;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(botMsgDiv.innerText.replace('Copy', '').trim());
        copyBtn.innerHTML = `<i class="ph ph-check"></i> Copied!`;
        setTimeout(() => {
            copyBtn.innerHTML = `<i class="ph ph-copy"></i> Copy`;
        }, 2000);
    };
    botMsgDiv.appendChild(copyBtn);
    
    // AI will now speak the reply
    speakText(reply); 
    
    scrollToBottom();
}

// 🧠 SUMMARY LOGIC
async function generateSummary() {
    if (!pdfText) return alert("Please upload a PDF first!");

    const resultDiv = document.getElementById("summaryResult");
    resultDiv.innerHTML = `<div class="loader"><div class="spinner"></div> Generating your summary...</div>`;

    const prompt = `Summarize this PDF in a structured, easy-to-read format with bullet points:\n${pdfText.substring(0, 10000)}`;
    const res = await callAI(prompt);

    resultDiv.innerHTML = marked.parse(res);
    
    // Summary banne ke baad download button enable ho jayega
    const downloadBtn = document.getElementById("downloadPdfBtn");
    if (downloadBtn) downloadBtn.style.display = "inline-flex";
}

// ❓ QUIZ LOGIC
async function generateQuiz() {
    if (!pdfText) return alert("Please upload a PDF first!");

    const resultDiv = document.getElementById("quizResult");
    resultDiv.innerHTML = `<div class="loader" style="margin-left: 10px;"><div class="spinner"></div> Generating interactive quiz...</div>`;

    const prompt = `Create exactly 5 multiple choice questions based on the following PDF. 
    You MUST respond ONLY with a raw JSON array. Do NOT wrap it in markdown code blocks.
    Format: [{"question": "...", "options": ["...", "..."], "answer": "..."}]
    PDF Data: ${pdfText.substring(0, 8000)}`;

    let res = await callAI(prompt);

    try {
        let cleanJson = res.replace(/```json/gi, '').replace(/```/g, '').trim();
        const quizData = JSON.parse(cleanJson);

        renderInteractiveQuiz(quizData);

    } catch (err) {
        resultDiv.innerHTML = `<div class="glass-card">${marked.parse(res)}</div>`;
    }
}

// 🔥 QUIZ SCORE TRACKING (NEW)
function saveQuiz(score, total) {
    let quizData = JSON.parse(localStorage.getItem("quizData")) || [];
    
    // Yahan hum score ko percentage me badal rahe hain
    let percentage = Math.round((score / total) * 100);
    quizData.push(percentage);
    
    // Graph ko bohot lamba hone se rokne ke liye sirf last 10 tests save rakhenge
    if (quizData.length > 10) quizData.shift();
    
    localStorage.setItem("quizData", JSON.stringify(quizData));
}



// 🔥 SECURE AI CALL
async function callAI(prompt) {
    try {
        const res = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await res.json();
        return data.reply || "No response from AI.";
    } catch (err) {
        return "Error connecting to AI: " + err.message;
    }
}

// --- HELPER FUNCTIONS ---

function addUserMessage(text) {
    const chat = document.getElementById("chat");
    const div = document.createElement("div");
    div.className = "msg user";
    div.innerText = text;
    chat.appendChild(div);
    scrollToBottom();
}

function addBotMessage(text) {
    const chat = document.getElementById("chat");
    const div = document.createElement("div");
    div.className = "msg bot";
    div.innerHTML = marked.parse(text);
    
    // Copy button add kiya normal bot messages ke liye
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `<i class="ph ph-copy"></i> Copy`;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(div.innerText.replace('Copy', '').trim());
        copyBtn.innerHTML = `<i class="ph ph-check"></i> Copied!`;
        setTimeout(() => {
            copyBtn.innerHTML = `<i class="ph ph-copy"></i> Copy`;
        }, 2000);
    };
    div.appendChild(copyBtn);
    
    chat.appendChild(div);
    scrollToBottom();
}

function addTypingIndicator() {
    const chat = document.getElementById("chat");
    const div = document.createElement("div");
    div.className = "msg bot";
    div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chat.appendChild(div);
    scrollToBottom();
    return div;
}

function scrollToBottom() {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
}

function getRelevantText(fullText, question) {
    const words = question.toLowerCase().split(" ");
    let lines = fullText.split("\n");
    let filtered = lines.filter(line => words.some(word => line.toLowerCase().includes(word)));
    return filtered.length === 0 ? fullText.substring(0, 5000) : filtered.join(" ").substring(0, 5000);
}

// OCR FUNCTIONS
async function extractTextFromImage(file) {
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    return text;
}

async function extractTextFromScannedPDF(pdf) {
    let finalText = "";
    const uploadText = document.getElementById("uploadText");
    for (let i = 1; i <= pdf.numPages; i++) {
        uploadText.innerText = `OCR Processing: Page ${i}/${pdf.numPages}`;
        let page = await pdf.getPage(i);
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        let viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
        finalText += text + "\n\n";
        canvas.width = 0; canvas.height = 0;
    }
    return finalText;
}

function renderInteractiveQuiz(data) {
    const container = document.getElementById("quizResult");
    container.innerHTML = "";

    let score = 0;
    let answeredCount = 0;
    const totalQuestions = data.length;

    // 1. Create Quiz Header (Score & Progress Text)
    const quizHeader = document.createElement("div");
    quizHeader.className = "quiz-header";
    quizHeader.innerHTML = `
        <span id="quizProgressText">Questions: 0/${totalQuestions}</span>
        <span id="liveScoreText">Score: 0</span>
    `;
    container.appendChild(quizHeader);

    // 2. Create Progress Bar
    const progContainer = document.createElement("div");
    progContainer.className = "progress-container";
    progContainer.innerHTML = `<div class="progress-bar" id="quizProgressBar"></div>`;
    container.appendChild(progContainer);

    // 3. Render Questions
    data.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "quiz-card";
        card.innerHTML = `<div class="quiz-question">${index + 1}. ${item.question}</div>`;
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "quiz-options";

        item.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "quiz-option";
            btn.innerText = opt;

            btn.onclick = () => {
                if (card.dataset.answered) return;

                card.dataset.answered = "true";
                answeredCount++;
                Array.from(optionsContainer.children).forEach(b => b.disabled = true);

                // Check answer
                if (opt === item.answer) {
                    btn.classList.add("correct");
                    score++;
                } else {
                    btn.classList.add("wrong");
                    Array.from(optionsContainer.children).forEach(b => {
                        if (b.innerText === item.answer) b.classList.add("correct");
                    });
                }

                // Update Progress & Score UI
                document.getElementById("quizProgressText").innerText = `Questions: ${answeredCount}/${totalQuestions}`;
                document.getElementById("liveScoreText").innerText = `Score: ${score}`;
                
                const progressPercent = (answeredCount / totalQuestions) * 100;
                document.getElementById("quizProgressBar").style.width = `${progressPercent}%`;

                // ✅ Check if Quiz Completed
                if (answeredCount === totalQuestions) {
                    saveQuiz(score, totalQuestions); // <-- YE LINE THEEK KI GAYI HAI
                    
                    // Show Final Score after a short delay
                    setTimeout(() => {
                        container.innerHTML = `
                            <div class="final-score-card">
                                <h3>🎉 Quiz Completed!</h3>
                                <p>Your Final Score</p>
                                <h2>${score} / ${totalQuestions}</h2>
                                <p style="color: var(--text-muted);">${score === totalQuestions ? 'Perfect Score! 🔥' : 'Good job! Keep learning.'}</p>
                                <button onclick="generateQuiz()" style="margin-top: 20px;">
                                    <i class="ph-bold ph-arrow-clockwise"></i> Try Again
                                </button>
                            </div>
                        `;
                    }, 1000);
                }
            };

            optionsContainer.appendChild(btn);
        });

        card.appendChild(optionsContainer);
        container.appendChild(card);
    });
}


function saveTopic(topic) {
    let topics = JSON.parse(localStorage.getItem("topics")) || [];

    if (!topics.includes(topic)) {
        topics.push(topic);
    }

    localStorage.setItem("topics", JSON.stringify(topics));
}

// ⏱️ STUDY TIME SAVE
window.addEventListener("beforeunload", () => {
    let totalTime = localStorage.getItem("studyTime") || 0;
    let sessionTime = Math.floor((Date.now() - startTime) / 60000);
    totalTime = parseInt(totalTime) + sessionTime;
    localStorage.setItem("studyTime", totalTime);
});

// --- VOICE FEATURE LOGIC (Optimized for Hindi) ---

const micBtn = document.getElementById("micBtn");
const inputField = document.getElementById("input");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    
    // ✨ CHANGE 1: Hindi recognition set kari hai
    recognition.lang = 'hi-IN'; 

    micBtn.addEventListener("click", () => {
        if (micBtn.classList.contains("listening")) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    recognition.onstart = () => {
        micBtn.classList.add("listening");
        inputField.placeholder = "Suniye, main sun raha hoon...";
    };

    recognition.onend = () => {
        micBtn.classList.remove("listening");
        inputField.placeholder = "Ask about your PDF...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        sendMsg();
    };
}

// --- 🔊 VOICE RESPONSE FINAL LOGIC (Natural Hindi Accent) ---

const voicePill = document.getElementById("voiceStatusPill");
const stopBtn = document.getElementById("stopVoiceBtn");

function speakText(text) {
    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/[*#_`]/g, "")
        .replace(/https?:\/\/\S+/g, "link")
        .trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // ✨ CHANGE 2: Hindi Voice Accent set kiya hai
    utterance.lang = 'hi-IN'; 
    
    // Hindi ke liye 1.0 ya 1.1 speed sabse best hoti hai
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;

    // ✨ CHANGE 3: Behtareen Hindi Voice Select karna
    // Browser ke paas kai voices hoti hain, hum 'hi-IN' wali filter karenge
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi'));
    
    if (hindiVoice) {
        utterance.voice = hindiVoice;
    }

    utterance.onstart = () => {
        if (voicePill) voicePill.classList.add("active");
    };

    utterance.onend = () => {
        if (voicePill) voicePill.classList.remove("active");
    };

    utterance.onerror = () => {
        if (voicePill) voicePill.classList.remove("active");
    };

    window.speechSynthesis.speak(utterance);
}

// 🛑 Stop Button Event
if (stopBtn) {
    stopBtn.addEventListener("click", () => {
        window.speechSynthesis.cancel();
        if (voicePill) voicePill.classList.remove("active");
    });
}
