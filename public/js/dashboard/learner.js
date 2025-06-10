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
  addDoc,
  doc,
  getDoc,
  Timestamp
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
const tutorList = document.getElementById("tutorList");
const requestedList = document.getElementById("requestedList");

let currentUID = null;
let currentUserData = {};

// Cache tutor names for quick lookup
const tutorNameCache = {};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUID = user.uid;

    const studentRef = doc(db, "students", currentUID);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      currentUserData = studentSnap.data();
      studentNameHeader.textContent = currentUserData.name || "Student";
      await loadTutorPosts();
      await loadRequestedCourses();
    }
  } else {
    window.location.href = "/login.html";
  }
});

async function loadTutorPosts() {
  tutorList.innerHTML = "";

  // Get all tutor posts except current user's
  const q = query(collection(db, "tutorPosts"), where("uid", "!=", currentUID));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    tutorList.innerHTML = "<p>No available tutors found.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    const postId = docSnap.id;

    const div = document.createElement("div");
    div.className = "notification-card tutor-post";
    div.innerHTML = `
      <p><strong>Course:</strong> ${post.course}</p>
      <p><strong>Tutor:</strong> ${post.name}</p>
      <p><strong>Location:</strong> ${post.location}</p>
      <p><strong>Days:</strong> ${post.days.join(", ")}</p>
      <p><strong>Time:</strong> ${convertTo12Hour(post.startTime)} - ${convertTo12Hour(post.endTime)}</p>
      <p><strong>Description:</strong> ${post.description || "None"}</p>
      <button class="btn send-request-btn" data-id="${postId}" data-tutor-id="${post.uid}" data-course="${post.course}">📨 Send Request</button>
    `;

    tutorList.appendChild(div);

    // Cache tutor name for later use
    tutorNameCache[post.uid] = post.name;
  });

  // Add listeners for send request buttons
  document.querySelectorAll(".send-request-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.id;
      const tutorId = btn.dataset["tutorId"];
      const course = btn.dataset.course;
      await sendRequest(postId, tutorId, course);
    });
  });
}

async function sendRequest(postId, tutorId, course) {
  try {
    // Check if a request for this course by this learner already exists and is not rejected
    const existingRequestQuery = query(
      collection(db, "tutorRequests"),
      where("learnerId", "==", currentUID),
      where("course", "==", course),
      where("status", "in", ["pending", "accepted"]) // Only pending or accepted block new request
    );
    const existingSnapshot = await getDocs(existingRequestQuery);

    if (!existingSnapshot.empty) {
      alert(`You already have a pending or accepted request for the course "${course}".`);
      return;
    }

    await addDoc(collection(db, "tutorRequests"), {
      tutorId,
      learnerId: currentUID,
      learnerName: currentUserData.name || "Unknown",
      learnerIubId: currentUserData.iubId || "",
      course,
      postId,
      status: "pending",
      timestamp: Timestamp.now()
    });

    const div = document.createElement("div");
    div.className = "notification-card success-msg";
    div.innerHTML = `<p>✅ Request sent for <strong>${course}</strong> to tutor.</p>`;
    requestedList.appendChild(div);

    setTimeout(() => div.remove(), 4000);

    // Refresh requested courses list to show new request
    await loadRequestedCourses();

  } catch (err) {
    console.error("Failed to send request:", err);
  }
}

async function loadRequestedCourses() {
  requestedList.innerHTML = "";

  const q = query(collection(db, "tutorRequests"), where("learnerId", "==", currentUID));
  const snapshot = await getDocs(q);

  let hasVisibleRequest = false;

  for (const docSnap of snapshot.docs) {
    const req = docSnap.data();

    // Check if the associated tutor post still exists
    const postRef = doc(db, "tutorPosts", req.postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      continue; // Skip if tutor post has been deleted
    }

    hasVisibleRequest = true;

    // Get tutor name from cache or fallback
    const tutorName = tutorNameCache[req.tutorId] || req.tutorId;

    // Status styles and emojis
    let statusDisplay = "";
    switch ((req.status || "pending").toLowerCase()) {
      case "accepted":
        statusDisplay = `<span style="color: green; font-weight: bold;"> Accepted</span>`;
        break;
      case "rejected":
        statusDisplay = `<span style="color: red; font-weight: bold;"> Rejected</span>`;
        break;
      default:
        statusDisplay = `<span style="color: gray; font-weight: bold;">⏳ Pending</span>`;
    }

    const div = document.createElement("div");
    div.className = "notification-card";
    div.innerHTML = `
      <p><strong>Course:</strong> ${req.course}</p>
      <p><strong>Requested To:</strong> ${tutorName}</p>
      <p><strong>Request Date:</strong> ${new Date(req.timestamp.toDate()).toLocaleString()}</p>
      <p><strong>Status:</strong> ${statusDisplay}</p>
    `;
    requestedList.appendChild(div);
  }

  if (!hasVisibleRequest) {
    requestedList.innerHTML = "<p>No requests sent yet.</p>";
  }
}

function convertTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":");
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const formatted = `${((h + 11) % 12 + 1)}:${minute} ${suffix}`;
  return formatted;
}
