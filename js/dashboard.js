/* // 📊 LOAD BASIC DATA

document.getElementById("pdfCount").innerText =
    localStorage.getItem("pdfCount") || 0;

let topics = JSON.parse(localStorage.getItem("topics")) || [];
document.getElementById("topicsCount").innerText = topics.length;

let time = localStorage.getItem("studyTime") || 0;
document.getElementById("studyTime").innerText = time + " min";


// 📈 QUIZ GRAPH DATA

let quizData = JSON.parse(localStorage.getItem("quizData")) || [];

// Agar data nahi hai
if (quizData.length === 0) {
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("quizChart").style.display = "none";
} 
else {
    const ctx = document.getElementById("quizChart");

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: quizData.map((_, i) => `Test ${i + 1}`),
            datasets: [{
                label: 'Score Percentage (%)',
                data: quizData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#94a3b8",
                        font: { family: 'Inter', size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Score: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8" },
                    grid: { display: false }
                },
                y: {
                    min: 0,
                    max: 100, // Y-axis hamesha 0 se 100 rahega
                    ticks: { 
                        color: "#94a3b8",
                        stepSize: 20,
                        callback: function(value) { return value + "%"; }
                    },
                    grid: { color: "rgba(255, 255, 255, 0.05)" }
                }
            }
        }
    });
}

*/

/* 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCMXebF7sLllONAqK0d1Cgryf1g7PHDf94",
    authDomain: "ai-teaching-assistants.firebaseapp.com",
    projectId: "ai-teaching-assistants",
    storageBucket: "ai-teaching-assistants.firebasestorage.app",
    messagingSenderId: "1092142076008",
    appId: "1:1092142076008:web:d5c2f4e148fc8dcfb56bdd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User ki saved Device ID nikalte hain
const userId = localStorage.getItem("firebase_userId");

async function loadDashboardData() {
    if (!userId) return;

    const userDocRef = doc(db, "user_data", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();

        // Basic Data Load
        document.getElementById("pdfCount").innerText = data.pdfCount || 0;
        document.getElementById("topicsCount").innerText = data.topics ? data.topics.length : 0;
        document.getElementById("studyTime").innerText = (data.studyTime || 0) + " min";

        // Quiz Graph Load
        const quizData = data.quizData || [];
        renderGraph(quizData);
    } else {
        // Agar naya user hai toh 0 dikhayenge
        document.getElementById("pdfCount").innerText = "0";
        document.getElementById("topicsCount").innerText = "0";
        document.getElementById("studyTime").innerText = "0 min";
        renderGraph([]);
    }
}

function renderGraph(quizData) {
    if (quizData.length === 0) {
        document.getElementById("emptyState").style.display = "block";
        document.getElementById("quizChart").style.display = "none";
    } else {
        const ctx = document.getElementById("quizChart");
        document.getElementById("quizChart").style.display = "block";
        document.getElementById("emptyState").style.display = "none";

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: quizData.map((_, i) => `Test ${i + 1}`),
                datasets: [{
                    label: 'Score Percentage (%)',
                    data: quizData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: { color: "#94a3b8", stepSize: 20 },
                        grid: { color: "rgba(255, 255, 255, 0.05)" }
                    }
                }
            }
        });
    }
}

// Data load trigger karte hain
loadDashboardData();

*/
// File: js/dashboard.js

// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// 2. Firebase Config (Same as script.js)
const firebaseConfig = {
    apiKey: "AIzaSyCMXebF7sLllONAqK0d1Cgryf1g7PHDf94",
    authDomain: "ai-teaching-assistants.firebaseapp.com",
    projectId: "ai-teaching-assistants",
    storageBucket: "ai-teaching-assistants.firebasestorage.app",
    messagingSenderId: "1092142076008",
    appId: "1:1092142076008:web:d5c2f4e148fc8dcfb56bdd",
    measurementId: "G-BBP298QGT8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Get Logged In User
const currentUsername = localStorage.getItem("duke_username");

// Agar user bina login kiye dashboard par aaye, toh wapas bhej do
if (!currentUsername) {
    alert("Please login first to view your dashboard!");
    window.location.href = "index.html";
}

// 4. Fetch Data from Firebase
async function loadDashboardData() {
    try {
        const userRef = doc(db, "user_data", currentUsername);
        const userSnap = await getDoc(userRef);

        let pdfCount = 0;
        let studyTime = 0;
        let topics = [];
        let quizData = [];

        if (userSnap.exists()) {
            const data = userSnap.data();
            pdfCount = data.pdfCount || 0;
            studyTime = data.studyTime || 0;
            topics = data.topics || [];
            quizData = data.quizData || [];
        }

        // 5. Update UI Elements
        document.getElementById("pdfCount").innerText = pdfCount;
        document.getElementById("studyTime").innerText = studyTime + " min";
        
        const topicsContainer = document.getElementById("topicsList");
        if (topics.length > 0) {
            topicsContainer.innerHTML = topics.map(t => `<span class="topic-tag">${t}</span>`).join("");
        } else {
            topicsContainer.innerHTML = "<p style='color: var(--text-muted);'>No topics discussed yet. Start chatting!</p>";
        }

        // 6. Render Chart
        renderChart(quizData);

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        document.getElementById("topicsList").innerHTML = "<p style='color: var(--danger);'>Failed to load data.</p>";
    }
}

// 7. Chart.js Setup
function renderChart(dataArr) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Chart draw karne ke liye kam se kam 1 data point chahiye
    if (dataArr.length === 0) {
        dataArr = [0]; 
    }

    // Har test ko label dena (Quiz 1, Quiz 2, etc.)
    const labels = dataArr.map((_, index) => `Quiz ${index + 1}`);

    // Check light/dark mode for text color
    const isLightMode = localStorage.getItem("theme") === "light";
    const textColor = isLightMode ? '#1c1e21' : '#f8fafc';
    const gridColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quiz Score (%)',
                data: dataArr,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                tension: 0.4, // Smooth curve
                fill: true,
                pointBackgroundColor: '#10b981',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}

// Execute logic when page loads
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
});
