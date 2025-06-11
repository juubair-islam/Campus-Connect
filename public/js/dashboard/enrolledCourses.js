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

const enrolledList = document.getElementById("enrolledList");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const currentUID = user.uid;
    await loadEnrolledCourses(currentUID);
  } else {
    window.location.href = "/login.html";
  }
});

async function loadEnrolledCourses(currentUID) {
  enrolledList.innerHTML = "<p>Loading enrolled courses...</p>";

  try {
    const q = query(
      collection(db, "tutorRequests"),
      where("learnerId", "==", currentUID),
      where("status", "==", "accepted")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      enrolledList.innerHTML = "<p>You have not enrolled in any courses yet.</p>";
      return;
    }

    enrolledList.innerHTML = ""; // clear before adding

    for (const reqDoc of snapshot.docs) {
      const req = reqDoc.data();
      const postRef = doc(db, "tutorPosts", req.postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) continue;

      const post = postSnap.data();
      const tutorName = post.name || "Tutor";
      const timestamp = req.timestamp ? new Date(req.timestamp.toDate()).toLocaleString() : "Unknown";

      const div = document.createElement("div");
      div.className = "notification-card success-msg";
      div.innerHTML = `
        <p><strong>Course:</strong> ${req.course}</p>
        <p><strong>Tutor:</strong> ${tutorName}</p>
        <p><strong>Location:</strong> ${post.location}</p>
        <p><strong>Days:</strong> ${post.days.join(", ")}</p>
        <p><strong>Time:</strong> ${convertTo12Hour(post.startTime)} - ${convertTo12Hour(post.endTime)}</p>
        <p><strong>Description:</strong> ${post.description || "None"}</p>
        <p><strong>Accepted On:</strong> ${timestamp}</p>
      `;
      enrolledList.appendChild(div);
    }
  } catch (err) {
    console.error("Failed to load enrolled courses:", err);
    enrolledList.innerHTML = "<p>Error loading enrolled courses.</p>";
  }
}

function convertTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12 + 1)}:${minute} ${suffix}`;
}
