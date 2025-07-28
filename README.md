# VIT Men's Hostel Centralized Complaint System

A full-stack web application designed to streamline complaint management within VIT Men's Hostels. Students can easily register and track complaints, while administrators get a powerful dashboard to manage and resolve them efficiently.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=firebase)](https://vit-hostel-complaint-new.web.app/)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

### 📸 Project Showcase

| Login Page | Student Dashboard | Admin Dashboard |
| :---: | :---: | :---: |
| <img width="844" height="559" alt="image" src="https://github.com/user-attachments/assets/7c0a146b-da6e-4f38-a857-f20f3f1b9d2a" /> | <img width="1154" height="484" alt="image" src="https://github.com/user-attachments/assets/ada399f8-ec7a-45a8-ba6b-cc71e7f2c14e" /> | <img width="1158" height="676" alt="image" src="https://github.com/user-attachments/assets/f9a497db-aa55-4e14-80da-bf46be88c4dd" /> |

---

## ✨ Features

-   👤 **Dual User Portals:** Separate, tailored interfaces for both Students and Administrators.
-   🔒 **Secure Authentication:** Robust sign-in/sign-up functionality powered by** Firebase Authentication.**
-   📝 **Detailed Complaint Forms:** Students can submit complaints with category (Wi-fi, AC, Mess, etc.), description, and room number.
-   📊 **Admin Management Dashboard:** Admins can view all complaints, filter them by category or status, and **update their progress** (e.g., "Pending", "In Progress", "Resolved").
-   ⚡ **Real-time Updates:** Utilizes **Firebase Firestore** to ensure data is synced in real-time between the student and admin portals.
-   📱 **Responsive Design:** A clean and modern UI built with **React and Tailwind CSS**, fully** responsive for both desktop and mobile devices**.

---

## 🛠️ Tech Stack

-   **Frontend:** React (Vite), Tailwind CSS
-   **Backend & Database:** Firebase (Authentication, Firestore Realtime Database)
-   **Deployment:** Firebase Hosting
-   **Version Control:** Git & GitHub

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.
### 1. Clone the Repository

```bash
git clone [https://github.com/isthatejas/ComplaintSystem_VIT.git](https://github.com/isthatejas/ComplaintSystem_VIT.git)
cd ComplaintSystem_VIT
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Setup Environment Variables
This project requires Firebase API keys to connect to your Firebase backend.

Create a file named **.env.local** in the root of your project directory.
Go to your Firebase project's console -> Project Settings -> General tab.
Scroll down to "Your apps" and select the web app (</>).
Find the **firebaseConfig** object and copy the values into your **.env.local** file like this:
```bash
# .env.local

VITE_API_KEY="your-api-key"
VITE_AUTH_DOMAIN="your-auth-domain"
VITE_PROJECT_ID="your-project-id"
VITE_STORAGE_BUCKET="your-storage-bucket"
VITE_MESSAGING_SENDER_ID="your-Messaginger-id"
VITE_APP_ID="your-app-id"
```
### 4. Run the Development Server
```bash
npm run dev
```
The application should now be running on http://localhost:5173 (or another port if 5173 is in use).
