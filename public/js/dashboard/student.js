import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyAihSpLsBqzXZ0RwuD13Txh_qBxEil8kLY",
  authDomain: "campus-connect-portal.firebaseapp.com",
  projectId: "campus-connect-portal",
  storageBucket: "campus-connect-portal.appspot.com",
  messagingSenderId: "790415624874",
  appId: "1:790415624874:web:b5d9adb44c880567631ed3",
  measurementId: "G-FPCS9NSCFD"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const nameSpan = document.getElementById("studentName");
const idSpan = document.getElementById("studentId");
const deptSpan = document.getElementById("studentDept");
const majorSpan = document.getElementById("studentMajor");
const minorSpan = document.getElementById("studentMinor");
const nameHeader = document.getElementById("studentNameHeader");
const logoutBtn = document.getElementById("logoutBtn");

const lostFoundList = document.getElementById("lostFoundList");
const tutorRequestList = document.getElementById("tutorRequestList");
const notificationBox = document.getElementById("notificationBox");

// --- On Auth State ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;

    try {
      const studentRef = doc(db, "students", uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const data = studentSnap.data();

        // Update UI with student details
        nameSpan.textContent = data.name || "Unknown";
        idSpan.textContent = data.iubId || "N/A";
        deptSpan.textContent = data.department || "N/A";
        majorSpan.textContent = data.major || "N/A";
        minorSpan.textContent = data.minor || "None";
        nameHeader.textContent = data.name || "Student";

        // Fetch Lost & Found items
        fetchLostFoundItems();

        // Fetch Tutor Requests for this student
        fetchTutorRequests(uid);

        // Notifications
        showNotifications(data.name || "Student");

      } else {
        alert("Student record not found in Firestore.");
      }

    } catch (error) {
      console.error("Error fetching student data:", error);
    }

  } else {
    // No user logged in
    window.location.href = "/login.html";
  }
});

// --- Logout Function ---
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "../login.html";
  });
});

// --- Fetch Verified Lost & Found Items ---
async function fetchLostFoundItems() {
  lostFoundList.innerHTML = "<p>Loading lost items...</p>";

  const q = query(collection(db, "lostFound"), where("status", "==", "Verified"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    lostFoundList.innerHTML = "<p>No verified lost items currently.</p>";
    return;
  }

  lostFoundList.innerHTML = "";
  querySnapshot.forEach(doc => {
    const item = doc.data();
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <h4>${item.title || "Untitled"}</h4>
      <p><strong>Date:</strong> ${item.date || "N/A"}</p>
      <p><strong>Location:</strong> ${item.location || "Unknown"}</p>
      <p><strong>Description:</strong> ${item.description || ""}</p>
    `;
    lostFoundList.appendChild(div);
  });
}

// --- Fetch Tutor Requests Sent to This Student ---
async function fetchTutorRequests(studentUID) {
  tutorRequestList.innerHTML = "<p>Loading tutor requests...</p>";

  const q = query(
    collection(db, "tutorRequests"),
    where("toStudentId", "==", studentUID)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    tutorRequestList.innerHTML = "<p>No tutor requests sent to you yet.</p>";
    return;
  }

  tutorRequestList.innerHTML = "";
  querySnapshot.forEach(doc => {
    const req = doc.data();
    const div = document.createElement("div");
    div.className = "request-card";
    div.innerHTML = `
      <p><strong>From:</strong> ${req.fromName || "Unknown"}</p>
      <p><strong>Course:</strong> ${req.course || "N/A"}</p>
      <p><strong>Message:</strong> ${req.message || ""}</p>
      <p><strong>Status:</strong> ${req.status || "Pending"}</p>
    `;
    tutorRequestList.appendChild(div);
  });
}

// --- Notifications (Simple Mock) ---
function showNotifications(name) {
  const today = new Date().toLocaleDateString();
  notificationBox.innerHTML = `
    <div class="notification-card">
      <p>👋 Hello ${name}, welcome back!</p>
      <p>📅 Today is ${today}</p>
      <p>🎉 No major campus events today. Stay tuned!</p>
    </div>
  `;
}
