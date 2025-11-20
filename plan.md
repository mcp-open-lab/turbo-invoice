Here is the functional flow for your **LLM-Only Receipt Scanner**, broken down step-by-step without code.

### **1. The Upload Flow**
1.  **User Action:** User lands on the Dashboard and clicks the "Upload Receipt" button (or drags a file).
2.  **UploadThing (Client):** The file is uploaded directly to storage (S3/Blob) from the browser.
3.  **Trigger:** Once the upload finishes, the browser receives a `fileUrl` (the public link to the image).
4.  **Handoff:** The browser automatically calls your Server Action (`scanReceipt`), passing this `fileUrl`.

### **2. The Server-Side Processing (The "Black Box")**
1.  **Authentication Check:** The server verifies the user is logged in (via Clerk).
2.  **Image Fetch:** The server downloads the image from the `fileUrl` into a temporary memory buffer.
3.  **Gemini Request:**
    *   The server sends the image buffer + a prompt to Gemini 1.5/2.0 Flash.
    *   *Prompt:* "Look at this image. Extract Merchant, Date, Total, and Category. Return JSON."
4.  **Parsing:** The server receives the text response from Gemini and parses the JSON.
5.  **Database Insert:** The server creates a new row in the `receipts` table with:
    *   The `fileUrl`
    *   The extracted data (Merchant, Date, Total)
    *   Status set to `needs_review`

### **3. The User Feedback Loop**
1.  **UI Refresh:** The server action finishes and tells the frontend "Success."
2.  **Toast:** The user sees a "Receipt Processed" notification.
3.  **List Update:** The Dashboard automatically refreshes (revalidates) to show the new receipt card at the top of the list.
4.  **Review (Optional):** The user can click the card to open a "Details" view (if you build it next) to correct any mistakes the AI made.