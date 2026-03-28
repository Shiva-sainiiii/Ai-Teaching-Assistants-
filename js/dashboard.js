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
                label: 'Quiz Score',
                data: quizData,
                borderWidth: 3,
                tension: 0.3
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "white"
                    }
                },
                y: {
                    ticks: {
                        color: "white"
                    }
                }
            }
        }
    });
}