import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAihSpLsBqzXZ0RwuD13Txh_qBxEil8kLY",
  authDomain: "campus-connect-portal.firebaseapp.com",
  projectId: "campus-connect-portal",
  storageBucket: "campus-connect-portal.appspot.com",
  messagingSenderId: "790415624874",
  appId: "1:790415624874:web:b5d9adb44c880567631ed3",
  measurementId: "G-FPCS9NSCFD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const studentNameHeader = document.getElementById("studentNameHeader");
const enrolledList = document.getElementById("enrolledList");

let currentUID = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUID = user.uid;

    // Get student name from students collection
    const studentRef = doc(db, "students", currentUID);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      studentNameHeader.textContent = studentSnap.data().name || "Student";
    }

    await loadEnrolledCourses();
  } else {
    window.location.href = "/login.html";
  }
});

async function loadEnrolledCourses() {
  enrolledList.innerHTML = "<p>Loading enrolled courses...</p>";

  try {
    const q = query(
      collection(db, "tutorRequests"),
      where("learnerId", "==", currentUID),
      where("status", "==", "accepted")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      enrolledList.innerHTML = "<p>No enrolled courses found.</p>";
      return;
    }

    enrolledList.innerHTML = ""; // Clear

    for (const docSnap of snapshot.docs) {
      const req = docSnap.data();

      // Get tutor post details
      const postRef = doc(db, "tutorPosts", req.postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) continue;

      const post = postSnap.data();

      const div = document.createElement("div");
      div.className = "course-card";
      div.innerHTML = `
        <h3>${req.course}</h3>
        <p><strong>Tutor:</strong> ${post.name}</p>
        <p><strong>Location:</strong> ${post.location}</p>
        <p><strong>Schedule:</strong> ${post.days.join(", ")} — ${convertTo12Hour(post.startTime)} to ${convertTo12Hour(post.endTime)}</p>
        <p><strong>Description:</strong> ${post.description || "N/A"}</p>
        <div class="button-group">
          <button class="chat-btn">💬 Chat</button>
          <button class="material-btn">📁 Study Materials</button>
        </div>
      `;
      enrolledList.appendChild(div);
    }
  } catch (error) {
    console.error("Failed to load enrolled courses:", error);
    enrolledList.innerHTML = "<p>Error loading enrolled courses. Please try again later.</p>";
  }
}

function convertTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const formatted = `${((h + 11) % 12 + 1)}:${minute} ${suffix}`;
  return formatted;
}
