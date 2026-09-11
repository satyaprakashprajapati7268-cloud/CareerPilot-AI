# SmartHire – AI-Powered Intelligent Job Matching & Recruitment Portal

SmartHire is a modern, high-fidelity single-page web application (SPA) designed to streamline job matching and recruitment for both Job Seekers and Employers. It features simulated AI resume parsing, candidate scoring algorithms, auto-apply functions, visual status pipelines, mock interviews, and calendars.

---

## 🛠️ Prerequisites

You must have **Node.js** installed on your system to run the local development server:
- Download Node.js from [nodejs.org](https://nodejs.org/).

---

## 🚀 How to Run the Portal in VS Code

Follow these steps to open, run, and view the project in VS Code:

### Step 1: Open the Project
1. Open VS Code.
2. Select **File > Open Folder...** from the top menu.
3. Choose the project directory: `c:\project\SmartHire`

### Step 2: Install Server Dependencies (If not already installed)
1. Open the VS Code terminal (press **Ctrl + `** or select **Terminal > New Terminal**).
2. Run:
   ```bash
   npm install
   ```

### Step 3: Run the Development Server
You can launch the Vite server inside VS Code using any of the following methods:

- **Method A (Recommended - VS Code Build Task)**:
  Press **Ctrl + Shift + B** (or select **Terminal > Run Build Task...**) and select `npm: dev - Start SmartHire Server`.
  
- **Method B (NPM Script Sidebar)**:
  Hover over `package.json`, right-click `dev` in the NPM SCRIPTS list at the bottom left panel, and click **Run**.
  
- **Method C (VS Code Terminal)**:
  In the open terminal panel, type:
  ```bash
  npm run dev
  ```

Once running, click the local link (typically **`http://localhost:5173`**) in the terminal console to launch the portal in your browser.

---

## 🔍 How to Run Verification Tests
To run verification tests on the AI matching and regex parsing calculations, run the task from the terminal:
```bash
node verify-matching.js
```

---

## 📁 Project Directory Structure
* **`index.html`**: Visual interface frameworks (all tabs, screens, auth modals).
* **`styles.css`**: Design tokens, variables, grids, color rules, and media-queries.
* **`app.js`**: Core controller logic (navigation, inputs, persistence, Kanban pipelines).
* **`ai-engine.js`**: Keyword parsing regexes, scoring weights, mock interview trees.
* **`data-mock.js`**: Database seeds for jobs, applicant defaults, and schedules.
* **`verify-matching.js`**: Automated scoring correctness tests.
* **`.vscode/`**: VS Code configuration files (`tasks.json`, `launch.json`).
