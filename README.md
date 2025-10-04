# 🚀 ExpenseFlow  
**An intelligent expense management system with dynamic approval workflows.**

---

## 🏆 Odoo x Amalthea Hackathon 2025 Submission  

| **Category** | **Details** |
| :--- | :--- |
| **Team Name** | *So jate hai* |
| **Team Members** | Vedant, Saujas, Dhruv, Pratham |
| **Problem Statement** | Expense Management |
| **Reviewer Name** | *Aman Patel (ampa)* |

---

## 📸 Demo & Video Presentation  

- 🌐 **Live Site:** https://dhruv-meshram.github.io/expense-management-odoo/dashboard.html  
- 🎥 **Video Presentation:** *(Link will be added after coding ends)*  

---

## ✨ Key Features  

💡 **Dynamic Approval Workflows** – Admins can visually build multi-level approval chains (e.g., Manager → Finance) and set powerful conditional rules.  

⚙️ **Conditional Logic Engine** – Supports hybrid approval rules, such as requiring 60% of approvers *or* a specific director’s approval to pass a claim.  

📊 **Role-Based Dashboards** – Tailored views for Employees (submission), Managers (approval queue), and Admins (full oversight), ensuring clarity and focus.  

🧠 **AI-Powered OCR** – Instantly scan and digitize receipts with OCR, automatically extracting the amount, date, and vendor to eliminate manual entry.  

---

## 💡 Inspiration  

Built for the **Odoo x Amalthea Hackathon 2025**, ExpenseFlow addresses the problem of rigid and slow expense approvals.  
We focused on creating a **smart, flexible system** with a dynamic, conditional approval engine to bring **speed, accuracy, and transparency** to a universal business problem.

---

## 🧩 How It Works  

1. **User Input:**  
   A user submits an expense by filling out a form or scanning a receipt.  

2. **Processing:**  
   The system uses OCR to parse receipt data, applies company-defined rules, and automatically routes the claim to the correct approver.  

3. **Output:**  
   The claim appears in the designated approver’s queue. Employees can track the final *Approved/Rejected* status in real-time as it moves through the workflow.

---

## ⚙️ Tech Stack  

| **Category** | **Tools Used** |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **APIs / Libraries** | RestCountries API, ExchangeRate-API, OCR.space API |
| **Other Tools** | Postman (for API testing) |

---

## 🚀 Quick Start  

Follow these steps to run the project locally:

### **Prerequisites**  

- [Node.js](https://nodejs.org/) (includes npm)  
- [Git](https://git-scm.com/)  
- [MongoDB](https://www.mongodb.com/try/download/community) or [MongoDB Atlas](https://www.mongodb.com/atlas)

---

### **1️⃣ Backend Setup**

```bash
# Clone the backend repository
git clone https://github.com/<your-username>/expense-approval-backend.git
cd expense-approval-backend

# Install dependencies
npm install
# Create a .env file in the root and add your variables:
# PORT=5000
# DB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# OCR_API_KEY=your_ocr_api_key

# Start the server
npm start
```

### **2️⃣ Frontend Setup**
```bash
# Clone the frontend repository in a new terminal
git clone [https://github.com/](https://github.com/)[your-username]/expense-approval-frontend.git
cd expense-approval-frontend

# Configure the API URL in public/js/utils/config.js to point to your backend
# (e.g., const API_BASE_URL = 'http://localhost:5000';)

# Serve the login.html file using a live server (e.g., VS Code Live Server extension)
```
