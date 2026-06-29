# MCQ Quiz Live Exam Portal - Web Version

This is the web-compatible, high-fidelity replica of the **MCQ Quiz Android App**. Built with Jetpack Compose styling elements using modern **Tailwind CSS**, it features a beautiful dark-futuristic cosmic aesthetic with neon-cyan accents.

Designed to be hosted for free on **GitHub Pages**, students can access exams directly via web links, and teachers can manage everything from a centralized, secure web dashboard.

---

## 🚀 Key Web-Exclusive Features

1. **Anti-Cheat Browser Tracking**:
   - If a student minimizes the tab, switches tabs, or opens another application while taking an exam, the screen will immediately **freeze/lock**.
   - A secure, full-screen lockout dialog is shown. The student cannot close it.
   - The teacher is notified in real-time on the **Live Exam Monitor** with a flashing red warning indicator.

2. **Real-Time Remote Unblocking**:
   - The teacher can click an **"Unblock"** button on their Teacher Dashboard.
   - This sends a command to the student's screen in real-time, immediately closing their lock dialog and letting them resume the exam seamlessly.

3. **Pinned Countdown Timer**:
   - The countdown timer is pinned sticky to the top of the browser screen, ensuring it stays visible as the student scrolls down through long lists of questions. It flashes red in the final minute.

4. **Type-Safe URL Hash Routing**:
   - Supports direct sharing parameters (e.g., `https://yourusername.github.io/mcq-quiz-web/#/quiz/your-quiz-id`) taking students directly to specific exams.

---

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Push to GitHub
1. Create a new public or private repository on GitHub (e.g., named `mcq-quiz-web`).
2. Copy the files inside the `/web` folder of this project (`index.html`, `app.js`, `README.md`, `Code.gs`) into your repository root.
3. Commit and push the files to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MCQ Quiz Web portal"
   git branch -M main
   git remote add origin https://github.com/yourusername/mcq-quiz-web.git
   git push -u origin main
   ```

### Step 2: Enable GitHub Pages
1. Go to your repository page on GitHub.
2. Click on the **Settings** tab.
3. In the left sidebar, click on **Pages** (under the "Code and automation" section).
4. Under "Build and deployment", change the Source to **Deploy from a branch**.
5. Select your **main** (or **master**) branch and click **Save**.
6. Wait 1-2 minutes. GitHub will generate your website link (e.g., `https://yourusername.github.io/mcq-quiz-web/`).

---

## 🔑 Sheet Sync Setup (2 Options)

The portal can read/write data in your Google Sheets. Choose **Option A (Apps Script)** or **Option B (Direct Service Account)**.

### Option A: Google Apps Script Web App (RECOMMENDED & SECURE)
Since you are hosting on a public GitHub Pages link, this method is highly secure because it doesn't expose your Google Cloud Service Account credentials to public browser clients.

1. Create a new Google Sheet.
2. Click on **Extensions -> Apps Script** in the top menu.
3. Delete any default code in the editor.
4. Open the `Code.gs` file from this project, copy its entire contents, and paste it into the editor. Save the project (click the floppy disk icon).
5. In the top-right corner, click **Deploy -> New deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Configure:
   - **Description**: `MCQ Quiz Web API`
   - **Execute as**: **Me (your-email@gmail.com)**
   - **Who has access**: **Anyone** *(This is essential for the website to be able to talk to the script)*
8. Click **Deploy**. Authorize the permissions for your Google account.
9. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).
10. Open your GitHub Pages website link, click the **Settings gear icon (সেটিংস)** in the top right, paste your **Web App URL** in the box, and click **কনফিগারেশন সংরক্ষণ করুন**.

The website will now instantly synchronize and work perfectly!

---

### Option B: Direct Service Account Integration
If you prefer not to use Apps Script, you can configure the site to talk directly to the Google Sheets API.
1. Open your Google Sheet and copy its **Spreadsheet ID** from the browser address bar:
   `https://docs.google.com/spreadsheets/d/S_S_ID_HERE/edit`
2. Obtain a Google Cloud Platform Service Account JSON key.
3. Share your Google Sheet with the Service Account Client Email as an **Editor**.
4. Paste the Spreadsheet ID, Client Email, and Private Key in the **Settings panel (সেটিংস)** on the website.

---

## 🎯 Teacher Panel Login
- Access the dashboard at `your-site/#/teacher`.
- Authenticate with the username and password defined in the Google Sheet at row `Quizzes!D444:E444`.
- **Default fallback login**: `admin` / `admin123`
