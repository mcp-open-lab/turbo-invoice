Here is the prioritized feature list for your **True MVP**. This list focuses exclusively on the "Scan → Save → Export" loop, ruthlessly cutting anything that doesn't directly solve the problem of data entry.

### 1. Core User Flow Features

| Feature | Justification for MVP |
| :--- | :--- |
| **Single-User Authentication** (Clerk) | **Security & Speed.** You need to store data securely, but building auth from scratch is a time sink. Clerk handles sessions/security instantly so you can focus on the scanner. |
| **Universal "Upload Zone"** | **Unified UI.** Instead of building separate "Mobile Camera" and "Desktop Drag-and-Drop" modes, a single responsive upload button handles both. Mobile phones natively treat "file upload" as "open camera." |
| **List View Dashboard** | **Verification.** The user immediately needs to see that their receipt was captured and saved. A simple chronological table is the fastest way to provide this feedback. |

### 2. The Intelligence Layer (The "Secret Sauce")

| Feature | Justification for MVP |
| :--- | :--- |
| **Direct-to-LLM Processing** | **Simplicity.** By sending the image directly to Gemini (Multimodal), we remove the need for a separate OCR service (like OCR.space). This cuts your API dependencies in half and reduces code complexity. |
| **Auto-Categorization** | **Value Add.** An LLM can guess if a receipt is "Meals" or "Transport" with 90% accuracy. This saves the user a manual step and makes the app feel "smart" immediately. |
| **Structured JSON Output** | **Data Integrity.** We force the LLM to return strict JSON (`{ total: number, date: string }`). This ensures we can sort by price or date in the database without writing complex parsing logic. |

### 3. Data Management & Verification

| Feature | Justification for MVP |
| :--- | :--- |
| **"Needs Review" Status** | **Trust.** AI is not perfect. Tagging new uploads as "Needs Review" tells the user, *"We did our best, but you should double-check this."* It manages expectations. |
| **Side-by-Side Editor** | **Usability.** To correct the AI, the user must see the image and the form at the same time. This is the only complex UI component required for the MVP because it is the core verification step. |
| **CSV Export** | **The "Escape Hatch."** We are not building charts, graphs, or tax reports yet. By offering a CSV download, we let the user do their own reporting in Excel. This saves weeks of dev time. |

### 4. Infrastructure Features

| Feature | Justification for MVP |
| :--- | :--- |
| **Server Actions** | **Speed.** We are skipping a separate backend API. Server Actions allow the frontend to talk directly to the DB/AI, reducing the boilerplate code needed to ship. |
| **Vercel Blob/UploadThing** | **Zero Config.** Setting up an S3 bucket permissions policy is tedious. UploadThing provides a pre-configured S3 wrapper that works instantly. |

***

### ❌ What We Are Cutting (And Why)

*   **Folders & Tags:** Complexity trap. A flat list is fine for the first 100 receipts.
*   **Email Forwarding:** Requires setting up mail servers and webhooks. Too much infrastructure for Day 1.
*   **Gmail/Dropbox Connectors:** Requires Google/Dropbox OAuth verification which takes weeks.
*   **Search:** `Ctrl+F` works on a webpage for the MVP.
*   **User Settings:** Hardcode "USD" and "Dark Mode" for now.

This list represents the **minimum viable product**—it is the smallest thing you can build that is still useful.