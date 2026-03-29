// 📊 LOAD BASIC DATA

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
