import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAihSpLsBqzXZ0RwuD13Txh_qBxEil8kLY",
  authDomain: "campus-connect-portal.firebaseapp.com",
  projectId: "campus-connect-portal",
  storageBucket: "campus-connect-portal.firebasestorage.app",
  messagingSenderId: "790415624874",
  appId: "1:790415624874:web:b5d9adb44c880567631ed3",
  measurementId: "G-FPCS9NSCFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const loginSuccess = document.getElementById("loginSuccess");
const loginBtn = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous messages
  errorMessage.style.display = "none";
  loginSuccess.style.display = "none";

  const role = document.getElementById("role").value;
  const iubId = document.getElementById("iubId").value.trim();
  const password = document.getElementById("password").value;

  if (!role) {
    errorMessage.textContent = "Please select your role.";
    errorMessage.style.display = "block";
    return;
  }
  if (!iubId || !password) {
    errorMessage.textContent = "Please enter your IUB ID and password.";
    errorMessage.style.display = "block";
    return;
  }

  const email = `${iubId}@iub.edu.bd`;

  loginBtn.disabled = true;
  loading.style.display = "block";

  try {
    // Step 1: Authenticate user by email/password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Check Firestore collection based on role
    let collectionName;
    switch(role) {
      case "Student":
        collectionName = "students";
        break;
      case "Alumni":
        collectionName = "alumni";
        break;
      case "Faculty":
      case "Faculty/Admin":
        collectionName = "faculty";
        break;
      case "Admin":
        collectionName = "admin"; // change if you have a different admin collection
        break;
      default:
        collectionName = null;
    }

    if (!collectionName) {
      throw new Error("Invalid role selected");
    }

    // Step 3: Verify user exists in role-specific collection
    const userDocRef = doc(db, collectionName, user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // User authenticated but no profile in selected role collection
      throw new Error(`No ${role} profile found for this user. Please check your role selection.`);
    }

    // All good, show success and redirect
    loginSuccess.textContent = "Login successful! Redirecting...";
    loginSuccess.style.display = "block";

    setTimeout(() => {
      switch(role) {
        case "Student":
          window.location.href = `dashboard/student.html?uid=${user.uid}`;
          break;
        case "Alumni":
          window.location.href = `dashboard/alumni.html?uid=${user.uid}`;
          break;
        case "Faculty":
        case "Faculty/Admin":
          window.location.href = `dashboard/faculty.html?uid=${user.uid}`;
          break;
        case "Admin":
          window.location.href = `dashboard/admin.html?uid=${user.uid}`;
          break;
      }
    }, 1500);

  } catch (error) {
    console.error("Login failed:", error);
    errorMessage.style.display = "block";

    if (error.code === "user-not-found") {
      errorMessage.textContent = "User not found. Please check your ID or sign up.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage.textContent = "Incorrect password. Please try again.";
    } else {
      errorMessage.textContent = error.message || "Login failed. Please check your credentials.";
    }
  } finally {
    loginBtn.disabled = false;
    loading.style.display = "none";
  }
});
