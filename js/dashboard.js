

 
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


        
