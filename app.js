// ==========================================
// MCQ Quiz - Complete Client Side Logic
// ==========================================

// --- App Configurations & Defaults ---
const DEFAULT_CONFIG = {
    spreadsheetId: "1VgEmU2Lmv9Qlxbuam9Qq3bjpKqz0WAbtICZxs_Ytmvk",
    clientEmail: "mcqtest@mcqtest-500711.iam.gserviceaccount.com",
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCu2mdNKuaevhXl
CrgTmtIK+LSkN8O9jtIJjPGA/u5++AgEgNzpufNLmfrOAJy4VRDvD6mJJLoIur0A
UiM3ZtPw8h3sXxm2Qhwx5qcI8v8pBMvEKSxyl1XATAfUUiuLquXMWPKxv0GxoXpN
HG2EwPcEYTBBdZCoh/hjZYwk22nTOK5deq9gpHdeRRTw+OC6TqX0M4yIrf68oFRK
TS2tSac0P5rx9SsN3gDDwinh6xMdNKIuuOxj8+8+nJWlI6oYzWkVw1eADcw2c82Q
JVbTJZFn/meSDBtK0FnNWxwGFGifB8AEYjSPBY7F1rXw7xBbpVA7/kgVircdMEFM
+868/gYzAgMBAAECggEAUz6Via6QBylWQSoeQu8laqXHUptd7EQviO56F8DHCNnK
72HuSrQFuYuAVU0DT9rn6fiZ7Tn3+6nzy1BPhdPFuWN7jYolMpk81SELiv4tLnkj
DavQhmm4IInR/Gp2YtMk/mmmeasleoz3LfkHxvkbYRFoKPHwwduiDKhO1UlEk5MR
oNT0/XPX9sJS8jk/X8hzsTCudTsb8q1i4OclHQ5+xkqY/4zcIyyi/3hnG4r7EF+w
lH2NTWS2IzfnITH2E4gK3tSIVVZ3ZeDXgqLY3hRv0xvz4SZjghccbVDs4nh7bHRu
DbXTJQOd/GnWZenICCIfCFr7A0Bb3wk202+cHxTAmQKBgQDkLrSFNk6b7Po4VMZL
pht0mEdIf6c2WSN0FIC+60B6uR+RbXLm1W5x2TEN1B/dMRA0HFHe/LwnpUEt/I0R
4w6hEIzjW6NONzEZq1/FCKe+0aZEzmwGF36BM3KTK2DKdtcldZXDIbR8K3SQGmHh
0YbhvX5Bf5OxgUKlb84+Dx1o9wKBgQDEK1smbcXEpP0qAqZwNtWJ4EfeJeDbwPzZ
yqSQqKc3neC+EpoUXpDNjz5PPpZf4RNyPyaa1s/o8bcEgH+gfikQWOhAc+G6Oegu
9nNHXYD3QjBVht24dxQf9q+h19OxBT8dLZi4hgPqA2pSRxaD6W78UczFYTzHVtFg
hWP7w3DZpQKBgDMJBzMsPFS/og9rVpag5k8jp/3dH0cWlMlntIv/DgLk2NysACEE
55jrHP+czCuqx5cAJoebO3IakgN5EwxHHoSDsR9A5bueuIqnO9pT30DcnzWQfbS3
GIJJQX0NHK7r+Z7VN9PW/AkxpvZ8EBxzwplGyrBXmm7/HCroYNachtVtAoGAVjiM
Lp7O7vhpgX56sxWW06vtSpmxdEUlnYAwxpgqLwrITiKU8GEEGiVciK4EoA2oY22Y
RTQnW8Zp36Ou9Naeq9237yQ/0X9EKugNkQ9q8MJ5xg2qBDrqcIYXefYHyGV68RMq
begRblij8ZfnMIF4U5SMgTCU6zSggGEAqhaj0jUCgYB7fHD+8N+MfLThrppIunqj
Hgbd9pF2iJSPYfLS9sLwOgKCvqz9q9BdhSbKgUvHz4/DNPP60w/weOok6Z0Vxp6O
nH72GdXyk97qXzL2xyuHVk5ptHQsTXzw7+oXlnfZ3OR+M6AbxLmRMd6sRHwJqr/yw
ObwQgmLps6gDqGUKpSH7wQ==
-----END PRIVATE KEY-----`,
    webAppUrl: "" // Set if using Google Apps Script deployment
};

// Current configuration loaded from storage or default
let config = { ...DEFAULT_CONFIG };

function loadConfig() {
    const saved = localStorage.getItem("mcq_quiz_config");
    if (saved) {
        try {
            config = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved config", e);
        }
    }
}

function saveConfig(newConfig) {
    config = { ...newConfig };
    localStorage.setItem("mcq_quiz_config", JSON.stringify(config));
}

// --- App State ---
const state = {
    quizzes: [],         // Array of { quiz, questions }
    results: [],         // Historic submissions
    activeSessions: [],  // Screen blur/active student tracking
    currentQuiz: null,   // Active quiz object
    currentQuestions: [],// Questions for active quiz
    currentAnswers: {},  // Map of questionId -> selectedOption (0-3)
    studentName: "",     // Taking the test
    activeSessionId: "", // Tracking student block session id
    isTeacherLoggedIn: false,
    activeTeacherTab: "quizzes", // quizzes, monitor, results
    examTimerInterval: null,
    monitorInterval: null,
    studentBlockPollInterval: null,
    quizFormQuestions: [], // Temporary questions array for creation
    editingQuizId: null // If editing, stores quiz ID
};

// --- Google Sheets Service client (Direct API vs Apps Script) ---
const SheetsService = {
    cachedToken: null,
    tokenExpiry: 0,

    async getAccessToken() {
        const now = Math.floor(Date.now() / 1000);
        if (this.cachedToken && now < this.tokenExpiry - 60) {
            return this.cachedToken;
        }

        try {
            const header = { alg: "RS256", typ: "JWT" };
            const payload = {
                iss: config.clientEmail,
                scope: "https://www.googleapis.com/auth/spreadsheets",
                aud: "https://oauth2.googleapis.com/token",
                exp: now + 3600,
                iat: now
            };

            const privateKeyClean = config.privateKey.trim();
            const jwt = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(payload), privateKeyClean);

            const formBody = new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt
            });

            const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formBody.toString()
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error("OAuth token swap failed: " + errText);
            }

            const data = await response.json();
            this.cachedToken = data.access_token;
            this.tokenExpiry = now + data.expires_in;
            return this.cachedToken;
        } catch (e) {
            console.error("Error signing JWT / fetching access token", e);
            throw e;
        }
    },

    // Check if sheets exist, create if not
    async ensureSheetsExist() {
        if (config.webAppUrl) return true; // Handled script side
        try {
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) return false;
            const metadata = await res.json();
            const sheetNames = (metadata.sheets || []).map(s => s.properties.title);

            const missing = [];
            if (!sheetNames.includes("Quizzes")) missing.push("Quizzes");
            if (!sheetNames.includes("Results")) missing.push("Results");
            if (!sheetNames.includes("ActiveSessions")) missing.push("ActiveSessions");

            if (missing.length === 0) return true;

            const requests = missing.map(name => ({
                addSheet: { properties: { title: name } }
            }));

            const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`;
            const updateRes = await fetch(batchUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ requests })
            });

            if (updateRes.ok) {
                console.log("Successfully created missing sheets:", missing);
                return true;
            } else {
                console.error("Failed to create missing sheets", await updateRes.text());
                return false;
            }
        } catch (e) {
            console.error("Error ensuring sheets exist", e);
            return false;
        }
    },

    async fetchQuizzes() {
        if (config.webAppUrl) {
            const res = await fetch(`${config.webAppUrl}?action=getQuizzes`);
            return await res.json();
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Quizzes!A:G`;
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) return [];
            const data = await response.json();
            if (!data.values) return [];

            const list = [];
            data.values.forEach(row => {
                if (row.length < 5) return;
                const id = row[0];
                const title = row[1];
                const subject = row[2];
                const isLive = row[3] === "true";
                let questions = [];
                try {
                    questions = JSON.parse(row[4]);
                } catch (e) {
                    console.error("Failed parsing questions JSON in row", e);
                }
                const timestamp = parseInt(row[5]) || 0;
                const durationMinutes = parseInt(row[6]) || 10;

                list.push({
                    quiz: { id, title, subject, isLive, timestamp, durationMinutes },
                    questions: questions
                });
            });
            return list;
        } catch (e) {
            console.error("Exception fetching quizzes", e);
            return [];
        }
    },

    async fetchResults() {
        if (config.webAppUrl) {
            const res = await fetch(`${config.webAppUrl}?action=getResults`);
            return await res.json();
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Results!A:I`;
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) return [];
            const data = await response.json();
            if (!data.values) return [];

            return data.values.map(row => {
                if (row.length < 8) return null;
                return {
                    id: row[0],
                    studentName: row[1],
                    quizId: row[2],
                    quizTitle: row[3],
                    subject: row[4],
                    score: parseInt(row[5]) || 0,
                    totalQuestions: parseInt(row[6]) || 0,
                    answersJson: row[7],
                    timestamp: parseInt(row[8]) || 0
                };
            }).filter(Boolean);
        } catch (e) {
            console.error("Exception fetching results", e);
            return [];
        }
    },

    async fetchActiveSessions() {
        if (config.webAppUrl) {
            const res = await fetch(`${config.webAppUrl}?action=getActiveSessions`);
            return await res.json();
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/ActiveSessions!A:G`;
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) return [];
            const data = await response.json();
            if (!data.values) return [];

            return data.values.map(row => ({
                sessionId: row[0],
                studentName: row[1],
                quizId: row[2],
                quizTitle: row[3],
                status: row[4],
                timestamp: parseInt(row[5]) || 0,
                lastPing: parseInt(row[6]) || 0
            }));
        } catch (e) {
            console.error("Exception fetching active sessions", e);
            return [];
        }
    },

    async appendQuiz(quiz, questions) {
        if (config.webAppUrl) {
            const response = await fetch(config.webAppUrl, {
                method: "POST",
                body: JSON.stringify({ action: "appendQuiz", quiz, questions })
            });
            return response.ok;
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Quizzes!A:G:append?valueInputOption=USER_ENTERED`;
            
            const row = [
                quiz.id,
                quiz.title,
                quiz.subject,
                quiz.isLive.toString(),
                JSON.stringify(questions),
                quiz.timestamp.toString(),
                quiz.durationMinutes.toString()
            ];

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    range: "Quizzes!A:G",
                    majorDimension: "ROWS",
                    values: [row]
                })
            });
            return response.ok;
        } catch (e) {
            console.error("Error appending quiz", e);
            return false;
        }
    },

    async appendResult(result) {
        if (config.webAppUrl) {
            const response = await fetch(config.webAppUrl, {
                method: "POST",
                body: JSON.stringify({ action: "appendResult", result })
            });
            return response.ok;
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Results!A:I:append?valueInputOption=USER_ENTERED`;

            const row = [
                result.id,
                result.studentName,
                result.quizId,
                result.quizTitle,
                result.subject,
                result.score.toString(),
                result.totalQuestions.toString(),
                result.answersJson,
                result.timestamp.toString()
            ];

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    range: "Results!A:I",
                    majorDimension: "ROWS",
                    values: [row]
                })
            });
            return response.ok;
        } catch (e) {
            console.error("Error appending result", e);
            return false;
        }
    },

    async createActiveSession(sessionId, studentName, quizId, quizTitle) {
        if (config.webAppUrl) {
            const response = await fetch(config.webAppUrl, {
                method: "POST",
                body: JSON.stringify({ action: "createActiveSession", sessionId, studentName, quizId, quizTitle })
            });
            return response.ok;
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/ActiveSessions!A:G:append?valueInputOption=USER_ENTERED`;

            const now = Date.now();
            const row = [
                sessionId,
                studentName,
                quizId,
                quizTitle,
                "ACTIVE",
                now.toString(),
                now.toString()
            ];

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    range: "ActiveSessions!A:G",
                    majorDimension: "ROWS",
                    values: [row]
                })
            });
            return response.ok;
        } catch (e) {
            console.error("Error creating active session", e);
            return false;
        }
    },

    async updateActiveSessionStatus(sessionId, status, lastPingValue = Date.now()) {
        if (config.webAppUrl) {
            const response = await fetch(config.webAppUrl, {
                method: "POST",
                body: JSON.stringify({ action: "updateActiveSessionStatus", sessionId, status, lastPing: lastPingValue })
            });
            return response.ok;
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            
            // Find row index
            const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/ActiveSessions!A:G`;
            const getRes = await fetch(getUrl, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!getRes.ok) return false;
            const data = await getRes.json();
            if (!data.values) return false;

            const rowIndex = data.values.findIndex(row => row[0] === sessionId);
            if (rowIndex === -1) return false;

            const rowNumber = rowIndex + 1; // Sheets are 1-indexed
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/ActiveSessions!A${rowNumber}:G${rowNumber}?valueInputOption=USER_ENTERED`;

            const existingRow = data.values[rowIndex];
            existingRow[4] = status; // Status column E
            existingRow[6] = lastPingValue.toString(); // Last ping column G

            const putRes = await fetch(updateUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    range: `ActiveSessions!A${rowNumber}:G${rowNumber}`,
                    majorDimension: "ROWS",
                    values: [existingRow]
                })
            });
            return putRes.ok;
        } catch (e) {
            console.error("Error updating active session status", e);
            return false;
        }
    },

    async updateAllQuizzes(quizzesWithQuestions) {
        if (config.webAppUrl) {
            const response = await fetch(config.webAppUrl, {
                method: "POST",
                body: JSON.stringify({ action: "updateAllQuizzes", quizzes: quizzesWithQuestions })
            });
            return response.ok;
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();

            // Clear first
            const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Quizzes!A:G:clear`;
            await fetch(clearUrl, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (quizzesWithQuestions.length === 0) return true;

            const rows = quizzesWithQuestions.map(item => [
                item.quiz.id,
                item.quiz.title,
                item.quiz.subject,
                item.quiz.isLive.toString(),
                JSON.stringify(item.questions),
                item.quiz.timestamp.toString(),
                item.quiz.durationMinutes.toString()
            ]);

            const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Quizzes!A:G?valueInputOption=USER_ENTERED`;
            const res = await fetch(writeUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    range: "Quizzes!A:G",
                    majorDimension: "ROWS",
                    values: rows
                })
            });
            return res.ok;
        } catch (e) {
            console.error("Error updating all quizzes online", e);
            return false;
        }
    },

    async fetchTeacherCredentials() {
        if (config.webAppUrl) {
            const res = await fetch(`${config.webAppUrl}?action=getCredentials`);
            return await res.json();
        }

        try {
            await this.ensureSheetsExist();
            const token = await this.getAccessToken();
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Quizzes!D444:E444`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.values && data.values.length > 0 && data.values[0].length >= 2) {
                    return {
                        username: data.values[0][0].trim(),
                        password: data.values[0][1].trim()
                    };
                }
            }
        } catch (e) {
            console.error("Failed fetching credentials from sheet D444:E444", e);
        }
        return null;
    }
};

// --- Toast Utility ---
function showToast(text, type = "success") {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    const toastIcon = document.getElementById("toast-icon");

    toastText.innerText = text;
    if (type === "error") {
        toastIcon.className = "fa-solid fa-triangle-exclamation text-rose-500 text-lg";
        toast.firstElementChild.className = "bg-slate-900 border border-rose-500 glow-red text-white px-5 py-3.5 rounded-xl flex items-center space-x-3 shadow-2xl";
    } else {
        toastIcon.className = "fa-solid fa-circle-check text-emeraldGreen text-lg";
        toast.firstElementChild.className = "bg-slate-900 border border-neonCyan glow-cyan text-white px-5 py-3.5 rounded-xl flex items-center space-x-3 shadow-2xl";
    }

    toast.classList.remove("translate-y-20", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {
        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-20", "opacity-0");
    }, 4000);
}

// --- Loading indicator helper ---
function toggleLoading(show) {
    const screenLoading = document.getElementById("screen-loading");
    if (show) {
        screenLoading.classList.remove("hidden");
        screenLoading.classList.add("flex");
    } else {
        screenLoading.classList.add("hidden");
        screenLoading.classList.remove("flex");
    }
}

// --- Dynamic Screen Routing Router ---
const screens = [
    "screen-dashboard",
    "screen-enter-name",
    "screen-exam",
    "screen-result",
    "screen-teacher-login",
    "screen-teacher-dashboard",
    "screen-quiz-form",
    "screen-setup"
];

function showScreen(screenId) {
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (id === screenId) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });

    // Handle interval cleanups based on active screen
    if (screenId !== "screen-exam") {
        clearInterval(state.examTimerInterval);
        clearInterval(state.studentBlockPollInterval);
        document.getElementById("block-overlay").classList.add("hidden");
    }
    if (screenId !== "screen-teacher-dashboard" || state.activeTeacherTab !== "monitor") {
        clearInterval(state.monitorInterval);
    }
}

async function handleRouting() {
    loadConfig();
    const hash = location.hash || "#/";
    
    if (hash === "#/") {
        showScreen("screen-dashboard");
        await loadQuizzesAndResults();
    } else if (hash.startsWith("#/quiz/")) {
        const quizId = hash.replace("#/quiz/", "");
        state.currentQuiz = state.quizzes.find(q => q.quiz.id === quizId);
        if (!state.currentQuiz) {
            // Fetch if not present loaded locally
            toggleLoading(true);
            const list = await SheetsService.fetchQuizzes();
            state.quizzes = list;
            state.currentQuiz = list.find(q => q.quiz.id === quizId);
            toggleLoading(false);
        }
        
        if (state.currentQuiz) {
            setupPreQuizInfo();
            showScreen("screen-enter-name");
        } else {
            showToast("Quiz not found or invalid link.", "error");
            location.hash = "#/";
        }
    } else if (hash.startsWith("#/results/")) {
        const resultId = hash.replace("#/results/", "");
        toggleLoading(true);
        const allResults = await SheetsService.fetchResults();
        const result = allResults.find(r => r.id === resultId);
        toggleLoading(false);
        if (result) {
            displayResultsDetail(result);
            showScreen("screen-result");
        } else {
            showToast("Result not found!", "error");
            location.hash = "#/";
        }
    } else if (hash === "#/teacher") {
        if (state.isTeacherLoggedIn) {
            showScreen("screen-teacher-dashboard");
            renderTeacherDashboard();
        } else {
            showScreen("screen-teacher-login");
        }
    } else if (hash === "#/teacher/create") {
        if (!state.isTeacherLoggedIn) { location.hash = "#/teacher"; return; }
        state.editingQuizId = null;
        setupQuizForm();
        showScreen("screen-quiz-form");
    } else if (hash.startsWith("#/teacher/edit/")) {
        if (!state.isTeacherLoggedIn) { location.hash = "#/teacher"; return; }
        const quizId = hash.replace("#/teacher/edit/", "");
        state.editingQuizId = quizId;
        setupQuizForm(quizId);
        showScreen("screen-quiz-form");
    } else if (hash === "#/setup") {
        showScreen("screen-setup");
        renderConfigForm();
    }
}

// --- Data Fetch & Display ---
async function loadQuizzesAndResults() {
    toggleLoading(true);
    try {
        const quizzes = await SheetsService.fetchQuizzes();
        state.quizzes = quizzes;
        
        const results = await SheetsService.fetchResults();
        state.results = results;

        renderStudentDashboard();
        if (state.isTeacherLoggedIn) {
            renderTeacherDashboard();
        }
        
        document.getElementById("sync-text").innerText = "Synced with Google Sheet";
    } catch (e) {
        showToast("Failed to sync data! Please check your connection.", "error");
        document.getElementById("sync-text").innerText = "Sync Failed (Offline)";
    } finally {
        toggleLoading(false);
    }
}

// --- Dashboard Student Renderer ---
function renderStudentDashboard() {
    const listRoot = document.getElementById("dashboard-quizzes-list");
    listRoot.innerHTML = "";

    const liveQuizzes = state.quizzes.filter(q => q.quiz.isLive);

    if (liveQuizzes.length === 0) {
        listRoot.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                <i class="fa-solid fa-hourglass-empty text-4xl mb-3 text-slate-600"></i>
                <p>No live exams available at the moment. Please try again later.</p>
            </div>
        `;
        return;
    }

    liveQuizzes.forEach(item => {
        const quiz = item.quiz;
        const totalQ = item.questions.length;
        const card = document.createElement("div");
        card.className = "bg-slate-900 border border-slate-800 hover:border-neonCyan hover:shadow-cyan rounded-2xl p-5 transition duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4";
        card.innerHTML = `
            <div class="space-y-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emeraldGreen border border-emeraldGreen/20">
                    <span class="relative flex h-1.5 w-1.5 mr-1.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emeraldGreen"></span>
                    </span>
                    LIVE EXAM
                </span>
                <h3 class="text-lg font-bold text-white mt-1">${quiz.title}</h3>
                <p class="text-xs text-slate-400 flex items-center">
                    <span class="mr-3"><i class="fa-solid fa-book-open text-slate-500 mr-1.5"></i> ${quiz.subject}</span>
                    <span class="mr-3"><i class="fa-solid fa-clock text-slate-500 mr-1.5"></i> ${quiz.durationMinutes} min</span>
                    <span><i class="fa-solid fa-clipboard-question text-slate-500 mr-1.5"></i> ${totalQ} Questions</span>
                </p>
            </div>
            <div>
                <button onclick="location.hash='#/quiz/${quiz.id}'" class="w-full sm:w-auto bg-neonCyan hover:bg-neonCyan/90 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition duration-200 shadow-lg glow-cyan flex items-center justify-center space-x-1">
                    <span>Join Exam</span> <i class="fa-solid fa-right-to-bracket text-xs"></i>
                </button>
            </div>
        `;
        listRoot.appendChild(card);
    });
}

// --- Join Quiz by Direct Code ---
function handleJoinQuizByInput() {
    const inputId = document.getElementById("join-quiz-id").value.trim();
    if (!inputId) {
        showToast("Please enter a Quiz ID!", "error");
        return;
    }
    location.hash = `#/quiz/${inputId}`;
}

// --- Pre-Quiz Student Name Setup screen ---
function setupPreQuizInfo() {
    const quiz = state.currentQuiz.quiz;
    const questions = state.currentQuiz.questions;
    
    const preInfo = document.getElementById("quiz-pre-info");
    preInfo.innerHTML = `
        <h4 class="font-bold text-white text-base">${quiz.title}</h4>
        <div class="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-300">
            <p><span class="text-slate-500">Subject:</span> ${quiz.subject}</p>
            <p><span class="text-slate-500">Duration:</span> ${quiz.durationMinutes} min</p>
            <p><span class="text-slate-500">Total Questions:</span> ${questions.length}</p>
            <p><span class="text-slate-500">Total Marks:</span> ${questions.length * 1}</p>
        </div>
    `;
    
    document.getElementById("student-name-input").value = "";
}

// --- Student Start Exam ---
async function startStudentExam() {
    const name = document.getElementById("student-name-input").value.trim();
    if (!name) {
        showToast("Please enter your name!", "error");
        return;
    }

    state.studentName = name;
    state.currentQuestions = state.currentQuiz.questions;
    state.currentAnswers = {};
    
    // Generate secure active tracking session ID
    state.activeSessionId = "session_" + Math.random().toString(36).substring(2, 9);
    
    toggleLoading(true);
    const createdSession = await SheetsService.createActiveSession(
        state.activeSessionId, 
        state.studentName, 
        state.currentQuiz.quiz.id, 
        state.currentQuiz.quiz.title
    );
    toggleLoading(false);

    if (!createdSession) {
        showToast("Failed to join exam session. Please check your internet connection.", "error");
        return;
    }

    // Load active exam values to UI
    document.getElementById("exam-title").innerText = state.currentQuiz.quiz.title;
    document.getElementById("exam-subject").innerText = state.currentQuiz.quiz.subject;
    document.getElementById("exam-student-name").innerText = state.studentName;

    renderExamQuestions();
    renderExamNavigator();
    startExamTimer(state.currentQuiz.quiz.durationMinutes);
    startAntiCheatTracking();

    showScreen("screen-exam");
}

// --- Render Questions inside Student Exam ---
function renderExamQuestions() {
    const container = document.getElementById("exam-questions-container");
    container.innerHTML = "";

    state.currentQuestions.forEach((q, idx) => {
        const qCard = document.createElement("div");
        qCard.id = `question-card-${idx}`;
        qCard.className = "bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 scroll-mt-24";
        qCard.innerHTML = `
            <div class="flex items-start space-x-3">
                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold font-mono text-neonCyan mt-0.5">${idx + 1}</span>
                <h3 class="text-base font-bold text-white leading-relaxed pt-0.5">${q.text}</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-10">
                ${[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, optIdx) => `
                    <label id="opt-label-${idx}-${optIdx}" onclick="selectStudentAnswer('${q.id}', ${optIdx}, ${idx})" class="flex items-center p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer text-sm font-semibold text-slate-300 hover:border-neonCyan/40 hover:bg-neonCyan/5 transition duration-200">
                        <input type="radio" name="q-option-${idx}" value="${optIdx}" class="accent-neonCyan w-4.5 h-4.5 mr-3 pointer-events-none">
                        <span>${opt}</span>
                    </label>
                `).join("")}
            </div>
        `;
        container.appendChild(qCard);
    });
}

function selectStudentAnswer(questionId, optIdx, questionIdx) {
    state.currentAnswers[questionId] = optIdx;
    
    // Update Navigator color UI
    const navBtn = document.getElementById(`nav-dot-${questionIdx}`);
    if (navBtn) {
        navBtn.className = "w-10 h-10 rounded-xl bg-neonCyan border border-neonCyan glow-cyan text-slate-950 font-bold flex items-center justify-center transition";
    }

    // Highlight selected option label style in UI
    for (let i = 0; i < 4; i++) {
        const lbl = document.getElementById(`opt-label-${questionIdx}-${i}`);
        const radio = lbl.querySelector("input");
        if (i === optIdx) {
            lbl.className = "flex items-center p-3.5 rounded-xl border border-neonCyan bg-neonCyan/10 cursor-pointer text-sm font-bold text-neonCyan transition duration-200";
            radio.checked = true;
        } else {
            lbl.className = "flex items-center p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer text-sm font-semibold text-slate-300 hover:border-neonCyan/40 hover:bg-neonCyan/5 transition duration-200";
            radio.checked = false;
        }
    }
}

// --- Render Right Panel Navigator Grid ---
function renderExamNavigator() {
    const grid = document.getElementById("exam-navigator-grid");
    grid.innerHTML = "";

    state.currentQuestions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.id = `nav-dot-${idx}`;
        btn.className = "w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold hover:border-neonCyan hover:text-white transition flex items-center justify-center text-xs";
        btn.innerText = idx + 1;
        btn.onclick = () => {
            document.getElementById(`question-card-${idx}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        grid.appendChild(btn);
    });
}

// --- Countdown timer logic ---
function startExamTimer(minutes) {
    let secondsLeft = minutes * 60;
    const timerText = document.getElementById("exam-timer");
    const timerBox = document.getElementById("timer-box");

    clearInterval(state.examTimerInterval);
    
    state.examTimerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(state.examTimerInterval);
            timerText.innerText = "00:00";
            showToast("Time limit reached! Submitting your exam automatically.", "error");
            submitStudentExam();
            return;
        }

        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        timerText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Urgent warning flashing
        if (secondsLeft < 60) {
            timerText.className = "font-orbitron font-extrabold text-2xl text-rose-500 tracking-wider";
            timerBox.className = "flex items-center space-x-4 bg-slate-950 border border-rose-500 px-5 py-3 rounded-xl glow-red animate-pulse";
        } else {
            timerText.className = "font-orbitron font-extrabold text-2xl text-white tracking-wider";
            timerBox.className = "flex items-center space-x-4 bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl glow-cyan";
        }
    }, 1000);
}

// --- Anti-cheat Blur Tracking Listeners ---
function startAntiCheatTracking() {
    // 1. Focus Loss Event triggers lock
    const handleInactivity = () => {
        if (location.hash.includes("#/exam") && !document.getElementById("block-overlay").classList.contains("hidden")) {
            return; // Already locked
        }
        
        // Trigger Lock
        triggerStudentBlock();
    };

    window.onblur = handleInactivity;
    document.onvisibilitychange = () => {
        if (document.visibilityState === 'hidden') {
            handleInactivity();
        }
    };
}

async function triggerStudentBlock() {
    // Show Fullscreen Locked Block UI
    document.getElementById("block-overlay").classList.remove("hidden");
    
    // Save blocked status online
    await SheetsService.updateActiveSessionStatus(state.activeSessionId, "BLOCKED");

    // Poll teacher unblock commands
    clearInterval(state.studentBlockPollInterval);
    state.studentBlockPollInterval = setInterval(async () => {
        const sessions = await SheetsService.fetchActiveSessions();
        const mySession = sessions.find(s => s.sessionId === state.activeSessionId);
        if (mySession && mySession.status === "ACTIVE") {
            // Teacher has unblocked the student!
            clearInterval(state.studentBlockPollInterval);
            document.getElementById("block-overlay").classList.add("hidden");
            showToast("You have been unlocked! Resuming exam.");
        }
    }, 2000);
}

// --- Student Exam Submission ---
function confirmSubmitExam() {
    if (confirm("Are you sure you want to submit your exam?")) {
        submitStudentExam();
    }
}

async function submitStudentExam() {
    clearInterval(state.examTimerInterval);
    clearInterval(state.studentBlockPollInterval);
    window.onblur = null;
    document.onvisibilitychange = null;

    toggleLoading(true);

    // Calculate score
    let score = 0;
    state.currentQuestions.forEach(q => {
        const selected = state.currentAnswers[q.id];
        if (selected !== undefined && selected === q.correctOption) {
            score++;
        }
    });

    const resultId = "res_" + Math.random().toString(36).substring(2, 9);
    const resultObj = {
        id: resultId,
        studentName: state.studentName,
        quizId: state.currentQuiz.quiz.id,
        quizTitle: state.currentQuiz.quiz.title,
        subject: state.currentQuiz.quiz.subject,
        score: score,
        totalQuestions: state.currentQuestions.length,
        answersJson: JSON.stringify(state.currentAnswers),
        timestamp: Date.now()
    };

    // 1. Save result to Google Sheet
    await SheetsService.appendResult(resultObj);

    // 2. Mark active session as completed
    await SheetsService.updateActiveSessionStatus(state.activeSessionId, "COMPLETED");

    toggleLoading(false);
    showToast("Your exam has been submitted successfully!");
    
    // Redirect to result screen
    location.hash = `#/results/${resultId}`;
}

// --- Render Student Result detail card ---
function displayResultsDetail(result) {
    document.getElementById("result-quiz-title").innerText = result.quizTitle;
    document.getElementById("result-student-info").innerText = `Student: ${result.studentName} • Subject: ${result.subject}`;

    const scorePct = Math.round((result.score / result.totalQuestions) * 100) || 0;
    document.getElementById("result-score-percent").innerText = `${scorePct}%`;
    document.getElementById("result-score-fraction").innerText = `${result.score.toString().padStart(2, '0')} / ${result.totalQuestions.toString().padStart(2, '0')} Correct`;

    const glowCard = document.getElementById("result-score-glow");
    if (scorePct >= 70) {
        glowCard.className = "w-40 h-40 rounded-full border-4 border-emerald-500/30 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden glow-green";
        document.getElementById("result-score-percent").className = "font-orbitron text-4xl font-black text-emeraldGreen";
    } else if (scorePct >= 40) {
        glowCard.className = "w-40 h-40 rounded-full border-4 border-amber-500/30 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.4)]";
        document.getElementById("result-score-percent").className = "font-orbitron text-4xl font-black text-amber-500";
    } else {
        glowCard.className = "w-40 h-40 rounded-full border-4 border-rose-500/30 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden glow-red";
        document.getElementById("result-score-percent").className = "font-orbitron text-4xl font-black text-rose-500";
    }

    document.getElementById("result-total-q").innerText = `${result.totalQuestions}`;
    document.getElementById("result-correct-q").innerText = `${result.score}`;

    // Dynamic Correct Quiz Solution
    const analysisRoot = document.getElementById("result-questions-analysis");
    analysisRoot.innerHTML = "";

    // Load active questions array
    const targetQuiz = state.quizzes.find(q => q.quiz.id === result.quizId);
    if (!targetQuiz) {
        analysisRoot.innerHTML = `<div class="text-xs text-slate-500">Failed to load detailed answers analysis.</div>`;
        return;
    }

    let answersMap = {};
    try {
        answersMap = JSON.parse(result.answersJson);
    } catch (e) {
        console.error(e);
    }

    targetQuiz.questions.forEach((q, idx) => {
        const selected = answersMap[q.id];
        const isCorrect = selected !== undefined && selected === q.correctOption;
        const optionsList = [q.optionA, q.optionB, q.optionC, q.optionD];

        const card = document.createElement("div");
        card.className = `border rounded-2xl p-5 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} space-y-3`;
        card.innerHTML = `
            <div class="flex items-start space-x-3">
                <span class="flex items-center justify-center w-6 h-6 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 mt-0.5">${idx + 1}</span>
                <h4 class="text-sm font-bold text-white leading-relaxed pt-0.5">${q.text}</h4>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-9">
                ${optionsList.map((opt, optIdx) => {
                    let optStyle = "border-slate-850 bg-slate-950/20 text-slate-400";
                    let prefixIcon = "";
                    if (optIdx === q.correctOption) {
                        optStyle = "border-emeraldGreen bg-emeraldGreen/10 text-emeraldGreen font-bold";
                        prefixIcon = '<i class="fa-solid fa-circle-check mr-2"></i>';
                    } else if (optIdx === selected) {
                        optStyle = "border-rose-500 bg-rose-500/10 text-rose-500 font-bold";
                        prefixIcon = '<i class="fa-solid fa-circle-xmark mr-2"></i>';
                    }
                    return `
                        <div class="flex items-center p-3 rounded-xl border text-xs ${optStyle}">
                            <span>${prefixIcon}${opt}</span>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
        analysisRoot.appendChild(card);
    });
}

function shareResultLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        showToast("Your result link has been copied successfully!");
    }).catch(e => {
        console.error(e);
        showToast("Failed to copy link.", "error");
    });
}

// --- Teacher Dashboard Portal Controller ---
function toggleTeacherView() {
    if (state.isTeacherLoggedIn) {
        location.hash = "#/teacher";
    } else {
        location.hash = "#/teacher";
    }
}

async function handleTeacherLogin() {
    const user = document.getElementById("teacher-username").value.trim();
    const pass = document.getElementById("teacher-password").value.trim();

    if (!user || !pass) {
        showToast("Please enter all fields!", "error");
        return;
    }

    toggleLoading(true);
    let credentials = await SheetsService.fetchTeacherCredentials();
    toggleLoading(false);

    // Provide default fallback credentials
    if (!credentials || !credentials.username || !credentials.password) {
        credentials = { username: "admin", password: "admin123" };
    }

    if (user === credentials.username && pass === credentials.password) {
        state.isTeacherLoggedIn = true;
        showToast("Login successful!");
        location.hash = "#/teacher";
    } else {
        showToast("Invalid username or password!", "error");
    }
}

function logoutTeacher() {
    state.isTeacherLoggedIn = false;
    showToast("Successfully logged out.");
    location.hash = "#/";
}

function switchTeacherTab(tabId) {
    state.activeTeacherTab = tabId;
    
    const tabs = ["quizzes", "monitor", "results"];
    tabs.forEach(id => {
        const btn = document.getElementById(`tab-btn-${id}`);
        const sect = document.getElementById(`teacher-tab-${id}`);
        if (id === tabId) {
            btn.className = "text-neonCyan border-b-2 border-neonCyan font-bold pb-3 text-base flex items-center space-x-2";
            sect.classList.remove("hidden");
        } else {
            btn.className = "text-slate-400 hover:text-white font-bold pb-3 text-base flex items-center space-x-2";
            sect.classList.add("hidden");
        }
    });

    if (tabId === "monitor") {
        refreshLiveMonitor();
        clearInterval(state.monitorInterval);
        state.monitorInterval = setInterval(refreshLiveMonitor, 3000);
    } else {
        clearInterval(state.monitorInterval);
    }
}

// --- Teacher Dashboard Content Renderers ---
function renderTeacherDashboard() {
    // 1. Quizzes Renderer
    const qList = document.getElementById("teacher-quizzes-list");
    qList.innerHTML = "";

    state.quizzes.forEach(item => {
        const q = item.quiz;
        const totalQ = item.questions.length;
        const shareUrl = `${window.location.origin}${window.location.pathname}#/quiz/${q.id}`;

        const card = document.createElement("div");
        card.className = "bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl";
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-lg font-bold text-white">${q.title}</h3>
                    <p class="text-xs text-slate-400 mt-1">${q.subject} • ${q.durationMinutes} min • ${totalQ} Questions</p>
                </div>
                <!-- Status badge toggle button -->
                <button onclick="toggleQuizLiveStatus('${q.id}')" class="px-3 py-1 rounded-full text-xs font-bold ${q.isLive ? 'bg-emerald-500/10 text-emeraldGreen border border-emeraldGreen/20' : 'bg-slate-950 text-slate-500 border border-slate-800'}">
                    ${q.isLive ? 'LIVE' : 'DRAFT'}
                </button>
            </div>
            
            <div class="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono text-slate-400 select-all overflow-x-auto">
                <i class="fa-solid fa-link text-slate-600"></i> <span class="whitespace-nowrap">${shareUrl}</span>
            </div>

            <div class="flex items-center justify-between border-t border-slate-850 pt-4 mt-2">
                <button onclick="copyToClipboard('${shareUrl}')" class="text-xs text-neonCyan hover:underline flex items-center">
                    <i class="fa-solid fa-copy mr-1.5"></i> Copy Link
                </button>
                <div class="flex items-center space-x-3">
                    <button onclick="location.hash='#/teacher/edit/${q.id}'" class="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg text-xs" title="Edit Quiz">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteQuizOnline('${q.id}')" class="p-2 text-rose-500 hover:text-rose-400 hover:bg-slate-850 rounded-lg text-xs" title="Delete Quiz">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        qList.appendChild(card);
    });

    // 2. Historic Results Renderer
    const resultsTbody = document.getElementById("teacher-results-tbody");
    resultsTbody.innerHTML = "";

    if (state.results.length === 0) {
        document.getElementById("results-empty").classList.remove("hidden");
    } else {
        document.getElementById("results-empty").classList.add("hidden");
        state.results.forEach(res => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-850/50 transition";
            tr.innerHTML = `
                <td class="p-4 font-bold text-white">${res.studentName}</td>
                <td class="p-4">${res.quizTitle}</td>
                <td class="p-4 text-xs font-mono text-slate-400">${res.subject}</td>
                <td class="p-4 text-center font-bold text-emeraldGreen">${res.score} / ${res.totalQuestions}</td>
                <td class="p-4 text-xs text-slate-400">${new Date(res.timestamp).toLocaleString("en-US")}</td>
                <td class="p-4 text-center">
                    <button onclick="location.hash='#/results/${res.id}'" class="text-xs text-neonCyan hover:underline font-bold">Result</button>
                </td>
            `;
            resultsTbody.appendChild(tr);
        });
    }
}

// --- Live Monitor tracking list ---
async function refreshLiveMonitor() {
    const spinner = document.getElementById("monitor-sync-spinner");
    spinner.classList.remove("hidden");
    
    try {
        const list = await SheetsService.fetchActiveSessions();
        state.activeSessions = list;
        
        const tbody = document.getElementById("live-monitor-tbody");
        tbody.innerHTML = "";

        const activeRightNow = state.activeSessions.filter(s => s.status !== "COMPLETED");

        // Set monitor count badge
        const badge = document.getElementById("active-count-badge");
        if (activeRightNow.length > 0) {
            badge.innerText = activeRightNow.length;
            badge.classList.remove("hidden");
            badge.classList.add("flex");
        } else {
            badge.classList.add("hidden");
        }

        if (activeRightNow.length === 0) {
            document.getElementById("monitor-empty").classList.remove("hidden");
        } else {
            document.getElementById("monitor-empty").classList.add("hidden");
            activeRightNow.forEach(s => {
                const tr = document.createElement("tr");
                tr.className = "hover:bg-slate-850/50 transition";
                
                let badgeClass = "bg-emerald-500/10 text-emeraldGreen border border-emeraldGreen/20";
                let statusLabel = "Testing";
                let actionBtn = `<span class="text-xs text-slate-500 font-medium">Secure</span>`;
                
                if (s.status === "BLOCKED") {
                    badgeClass = "bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse";
                    statusLabel = "Blocked (Focus Lost)";
                    actionBtn = `
                        <button onclick="unblockStudentOnline('${s.sessionId}')" class="px-3.5 py-1.5 rounded-lg bg-rose-500 text-slate-950 font-black text-xs hover:bg-rose-400 transition hover:shadow-lg">
                            Unblock
                        </button>
                    `;
                }

                tr.innerHTML = `
                    <td class="p-4 font-bold text-white">${s.studentName}</td>
                    <td class="p-4 text-xs">${s.quizTitle}</td>
                    <td class="p-4 text-xs font-mono text-slate-400">${new Date(s.timestamp).toLocaleTimeString()}</td>
                    <td class="p-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="p-4 text-center">${actionBtn}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        spinner.classList.add("hidden");
    }
}

async function unblockStudentOnline(sessionId) {
    toggleLoading(true);
    const success = await SheetsService.updateActiveSessionStatus(sessionId, "ACTIVE");
    toggleLoading(false);
    if (success) {
        showToast("Student unblocked successfully!");
        refreshLiveMonitor();
    } else {
        showToast("Failed to unblock. Check your connection.", "error");
    }
}

// --- Toggle Live Draft Status from List ---
async function toggleQuizLiveStatus(quizId) {
    const item = state.quizzes.find(q => q.quiz.id === quizId);
    if (!item) return;

    toggleLoading(true);
    item.quiz.isLive = !item.quiz.isLive;
    const success = await SheetsService.updateAllQuizzes(state.quizzes);
    toggleLoading(false);

    if (success) {
        showToast(item.quiz.isLive ? "Quiz is now LIVE!" : "Quiz has been set to DRAFT.");
        renderTeacherDashboard();
    } else {
        showToast("Failed to update quiz status!", "error");
    }
}

// --- Delete Quiz ---
async function deleteQuizOnline(quizId) {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    toggleLoading(true);
    const updatedList = state.quizzes.filter(q => q.quiz.id !== quizId);
    const success = await SheetsService.updateAllQuizzes(updatedList);
    toggleLoading(false);

    if (success) {
        state.quizzes = updatedList;
        showToast("Quiz deleted successfully!");
        renderTeacherDashboard();
    } else {
        showToast("Failed to delete quiz!", "error");
    }
}

// --- Dynamic Quiz Form Create / Edit Section ---
function setupQuizForm(quizId = null) {
    const titleInp = document.getElementById("form-quiz-title");
    const subjInp = document.getElementById("form-quiz-subject");
    const durInp = document.getElementById("form-quiz-duration");
    const heading = document.getElementById("quiz-form-heading");

    if (quizId) {
        heading.innerText = "Edit Quiz";
        const item = state.quizzes.find(q => q.quiz.id === quizId);
        titleInp.value = item.quiz.title;
        subjInp.value = item.quiz.subject;
        durInp.value = item.quiz.durationMinutes;
        
        if (item.quiz.isLive) {
            document.getElementById("form-quiz-islive-true").checked = true;
        } else {
            document.getElementById("form-quiz-islive-false").checked = true;
        }

        state.quizFormQuestions = JSON.parse(JSON.stringify(item.questions)); // Deep copy
    } else {
        heading.innerText = "Create New Quiz";
        titleInp.value = "";
        subjInp.value = "";
        durInp.value = "10";
        document.getElementById("form-quiz-islive-true").checked = true;
        
        // Initial 1 default empty question
        state.quizFormQuestions = [{
            id: "q_" + Math.random().toString(36).substring(2, 9),
            quizId: "",
            text: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctOption: 0
        }];
    }

    renderFormQuestions();
}

function renderFormQuestions() {
    const container = document.getElementById("form-questions-container");
    container.innerHTML = "";

    state.quizFormQuestions.forEach((q, idx) => {
        const div = document.createElement("div");
        div.className = "bg-slate-950 border border-slate-850 p-6 rounded-2xl relative space-y-4";
        div.innerHTML = `
            <!-- Question Delete Button -->
            <button onclick="removeFormQuestion('${q.id}')" class="absolute top-4 right-4 text-slate-500 hover:text-rose-500 text-sm" title="Delete Question">
                <i class="fa-solid fa-trash-can"></i>
            </button>

            <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Question ${idx + 1}</label>
                <input type="text" value="${q.text}" onkeyup="updateFormQuestionValue('${q.id}', 'text', this.value)" placeholder="e.g. Which of the following is a vector quantity?" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neonCyan text-sm">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${['A', 'B', 'C', 'D'].map((opt, optIdx) => `
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-[11px] font-semibold text-slate-500">Option ${opt}</label>
                            <label class="text-[10px] text-slate-400 flex items-center cursor-pointer">
                                <input type="radio" name="correct-radio-${idx}" value="${optIdx}" ${q.correctOption === optIdx ? 'checked' : ''} onclick="updateFormQuestionValue('${q.id}', 'correctOption', ${optIdx})" class="accent-neonCyan mr-1.5 w-3.5 h-3.5">
                                Correct Answer
                            </label>
                        </div>
                        <input type="text" value="${q[`option${opt}`]}" onkeyup="updateFormQuestionValue('${q.id}', 'option${opt}', this.value)" placeholder="Enter option text" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-neonCyan text-xs">
                    </div>
                `).join("")}
            </div>
        `;
        container.appendChild(div);
    });
}

function addFormQuestion() {
    state.quizFormQuestions.push({
        id: "q_" + Math.random().toString(36).substring(2, 9),
        quizId: state.editingQuizId || "",
        text: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: 0
    });
    renderFormQuestions();
}

function removeFormQuestion(id) {
    if (state.quizFormQuestions.length <= 1) {
        showToast("You must have at least 1 question!", "error");
        return;
    }
    state.quizFormQuestions = state.quizFormQuestions.filter(q => q.id !== id);
    renderFormQuestions();
}

function updateFormQuestionValue(qId, key, value) {
    const q = state.quizFormQuestions.find(item => item.id === qId);
    if (q) {
        q[key] = value;
    }
}

// --- Save Quiz Form online to spreadsheet ---
async function saveQuizForm() {
    const title = document.getElementById("form-quiz-title").value.trim();
    const subject = document.getElementById("form-quiz-subject").value.trim();
    const duration = parseInt(document.getElementById("form-quiz-duration").value) || 10;
    const isLive = document.getElementById("form-quiz-islive-true").checked;

    if (!title || !subject) {
        showToast("Title and Subject are required fields!", "error");
        return;
    }

    // Validation questions
    for (let i = 0; i < state.quizFormQuestions.length; i++) {
        const q = state.quizFormQuestions[i];
        if (!q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
            showToast(`Please complete Question ${i + 1} and all its options!`, "error");
            return;
        }
    }

    toggleLoading(true);

    if (state.editingQuizId) {
        // Edit flow
        const quizIndex = state.quizzes.findIndex(q => q.quiz.id === state.editingQuizId);
        if (quizIndex !== -1) {
            state.quizzes[quizIndex] = {
                quiz: { id: state.editingQuizId, title, subject, isLive, timestamp: Date.now(), durationMinutes: duration },
                questions: state.quizFormQuestions.map(q => ({ ...q, quizId: state.editingQuizId }))
            };
            const success = await SheetsService.updateAllQuizzes(state.quizzes);
            toggleLoading(false);
            if (success) {
                showToast("Quiz updated successfully!");
                location.hash = "#/teacher";
            } else {
                showToast("Failed to update quiz.", "error");
            }
        }
    } else {
        // Create flow
        const newQuizId = "quiz_" + Math.random().toString(36).substring(2, 9);
        const newQuiz = { id: newQuizId, title, subject, isLive, timestamp: Date.now(), durationMinutes: duration };
        const newQuestions = state.quizFormQuestions.map(q => ({ ...q, quizId: newQuizId }));
        
        const success = await SheetsService.appendQuiz(newQuiz, newQuestions);
        toggleLoading(false);
        if (success) {
            showToast("New quiz created successfully!");
            location.hash = "#/teacher";
        } else {
            showToast("Failed to create quiz. Check your spreadsheet.", "error");
        }
    }
}

// --- Settings configuration screen controller ---
function renderConfigForm() {
    document.getElementById("config-sheet-id").value = config.spreadsheetId;
    document.getElementById("config-client-email").value = config.clientEmail;
    document.getElementById("config-private-key").value = config.privateKey;
}

function saveConfigSettings() {
    const id = document.getElementById("config-sheet-id").value.trim();
    const email = document.getElementById("config-client-email").value.trim();
    const key = document.getElementById("config-private-key").value.trim();

    if (!id || !email || !key) {
        showToast("Spreadsheet ID, Client Email, and Private Key are all required!", "error");
        return;
    }

    const newConfig = {
        spreadsheetId: id,
        clientEmail: email,
        privateKey: key,
        webAppUrl: ""
    };

    saveConfig(newConfig);
    showToast("Configuration saved and updated successfully!");
    location.hash = "#/";
}

function resetConfigDefaults() {
    if (confirm("Are you sure you want to reset settings to default values?")) {
        saveConfig(DEFAULT_CONFIG);
        renderConfigForm();
        showToast("Configuration has been reset to defaults.");
    }
}

// --- Utils ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Link copied to clipboard!");
    }).catch(e => {
        showToast("Failed to copy link", "error");
    });
}

function filterResultsTable() {
    const query = document.getElementById("result-search-input").value.toLowerCase();
    const tbody = document.getElementById("teacher-results-tbody");
    const rows = tbody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const studentTd = rows[i].getElementsByTagName("td")[0];
        if (studentTd) {
            const txt = studentTd.textContent || studentTd.innerText;
            if (txt.toLowerCase().indexOf(query) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// --- Core Listeners ---
window.addEventListener("hashchange", handleRouting);
window.addEventListener("DOMContentLoaded", handleRouting);
