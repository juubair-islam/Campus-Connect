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
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAihSpLsBqzXZ0RwuD13Txh_qBxEil8kLY",
  authDomain: "campus-connect-portal.firebaseapp.com",
  projectId: "campus-connect-portal",
  storageBucket: "campus-connect-portal.appspot.com",
  messagingSenderId: "790415624874",
  appId: "1:790415624874:web:b5d9adb44c880567631ed3",
  measurementId: "G-FPCS9NSCFD"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const nameHeader = document.getElementById("studentNameHeader");
const tutorForm = document.getElementById("tutorForm");
const tutorPostList = document.getElementById("tutorPostList");
const messageBox = document.getElementById("messageBox");
const notificationBox = document.getElementById("notificationBox");
const learnerRequestsContainer = document.getElementById("learnerRequests");

// Fields
const courseInput = document.getElementById("course");
const daysInputs = document.querySelectorAll('input[name="availableDays"]');
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const descriptionInput = document.getElementById("description");
const locationInput = document.getElementById("location");
const postButton = document.getElementById("submitBtn");

let currentUID = null;
let studentData = {};
let editingPostId = null;

// Auth Check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUID = user.uid;
    const studentRef = doc(db, "students", currentUID);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      studentData = studentSnap.data();
      nameHeader.textContent = studentData.name || "Student";
      showNotifications(studentData.name || "Tutor");
      loadTutorPosts();
      loadLearnerRequests();
    } else {
      alert("Student data not found.");
    }
  } else {
    window.location.href = "/login.html";
  }
});

// Submit/Post or Update Form
tutorForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const location = locationInput.value.trim();
  const course = courseInput.value.trim();
  const days = Array.from(daysInputs).filter(cb => cb.checked).map(cb => cb.value);
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  const description = descriptionInput.value.trim();

  messageBox.textContent = "";
  messageBox.className = "";

  if (!course || days.length === 0 || !startTime || !endTime) {
    messageBox.textContent = "❌ Please fill in all required fields.";
    messageBox.className = "error-msg";
    setTimeout(() => {
      messageBox.textContent = "";
      messageBox.className = "";
    }, 3000);
    return;
  }

  try {
    if (editingPostId) {
      const postRef = doc(db, "tutorPosts", editingPostId);
      await updateDoc(postRef, { days, startTime, endTime, description, location });
      messageBox.textContent = "✅ Post updated successfully.";
      editingPostId = null;
      postButton.textContent = "Post";
      courseInput.disabled = false;
    } else {
      await addDoc(collection(db, "tutorPosts"), {
        uid: currentUID,
        name: studentData.name || "Unknown",
        iubId: studentData.iubId || "",
        course,
        location,
        days,
        startTime,
        endTime,
        description,
        timestamp: new Date()
      });
      messageBox.textContent = "✅ Successfully posted!";
    }

    messageBox.className = "success-msg";
    setTimeout(() => {
      messageBox.textContent = "";
      messageBox.className = "";
    }, 3000);

    tutorForm.reset();
    loadTutorPosts();
  } catch (err) {
    console.error("Error:", err);
    messageBox.textContent = "❌ Error while processing. Try again.";
    messageBox.className = "error-msg";
    setTimeout(() => {
      messageBox.textContent = "";
      messageBox.className = "";
    }, 3000);
  }
});

// Load Tutor Posts
async function loadTutorPosts() {
  tutorPostList.innerHTML = "";
  const q = query(collection(db, "tutorPosts"), where("uid", "==", currentUID));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    tutorPostList.innerHTML = "<p>No tutor posts found.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    const postId = docSnap.id;

    const div = document.createElement("div");
    div.className = "notification-card tutor-post";
    div.innerHTML = `
      <p><strong>Course:</strong> ${post.course}</p>
      <p><strong>Days:</strong> ${post.days.join(", ")}</p>
      <p><strong>Time:</strong> ${formatTime(post.startTime)} - ${formatTime(post.endTime)}</p>
      <p><strong>Location:</strong> ${post.location || "Not specified"}</p>
      <p><strong>Description:</strong> ${post.description || "None"}</p>
      <div class="action-buttons">
        <button class="btn edit-btn" data-id="${postId}" data-course="${post.course}">✏ Edit</button>
        <button class="btn delete-btn" data-id="${postId}">🗑 Delete</button>
      </div>
    `;

    tutorPostList.appendChild(div);
  });

  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => startEditPost(btn.dataset.id, btn.dataset.course))
  );

  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteTutorPost(btn.dataset.id))
  );
}

// Start Edit
async function startEditPost(postId, course) {
  const postRef = doc(db, "tutorPosts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const post = postSnap.data();

  editingPostId = postId;
  courseInput.value = course;
  courseInput.disabled = true;
  daysInputs.forEach(cb => cb.checked = post.days.includes(cb.value));
  startTimeInput.value = post.startTime;
  endTimeInput.value = post.endTime;
  descriptionInput.value = post.description || "";
  locationInput.value = post.location || "";

  postButton.textContent = "Update";
  messageBox.textContent = "📝 Editing mode enabled.";
}

// Delete Post
async function deleteTutorPost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    await deleteDoc(doc(db, "tutorPosts", postId));
    await loadTutorPosts();

    const msg = document.createElement("p");
    msg.className = "delete-msg";
    msg.textContent = "🗑️ Post deleted successfully.";
    tutorPostList.prepend(msg);
    setTimeout(() => msg.remove(), 3000);

    loadLearnerRequests(); // Refresh requests after deletion
  }
}

// Show Notifications
function showNotifications(name) {
  const today = new Date();
  const weekday = today.toLocaleString("en-US", { weekday: "long" });

  notificationBox.innerHTML = `
    <div class="notification-card">
      <p>📢 Hello ${name}, here’s your tutor panel.</p>
      <p>📅 ${today.toLocaleDateString()}</p>
      <p>📘 Keep your availability updated to receive tutoring requests.</p>
    </div>
  `;

  checkTodayTuition(weekday);
}

// Reminder for Today
async function checkTodayTuition(today) {
  const q = query(collection(db, "tutorPosts"), where("uid", "==", currentUID));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    if (post.days.includes(today)) {
      const div = document.createElement("div");
      div.className = "notification-card highlight";
      div.innerHTML = `
        <p>📌 Reminder: You have tutoring availability today (${today})</p>
        <p>🕒 ${post.startTime} - ${post.endTime} for ${post.course}</p>
      `;
      notificationBox.appendChild(div);
    }
  });
}

function formatTime(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

// Load Learner Requests Sent to This Tutor (Only for Existing Courses)
async function loadLearnerRequests() {
  if (!learnerRequestsContainer) return;

  learnerRequestsContainer.innerHTML = "";

  // Get existing courses posted by the tutor
  const tutorPostsSnap = await getDocs(query(collection(db, "tutorPosts"), where("uid", "==", currentUID)));
  const existingCourses = new Set();
  tutorPostsSnap.forEach(doc => existingCourses.add(doc.data().course));

  const requestsSnap = await getDocs(query(collection(db, "tutorRequests"), where("tutorId", "==", currentUID)));

  if (requestsSnap.empty) {
    learnerRequestsContainer.innerHTML = "<p>No requests found.</p>";
    return;
  }

  let shownAny = false;

  for (const docSnap of requestsSnap.docs) {
    const request = docSnap.data();
    const requestId = docSnap.id;

    // Skip if course was deleted
    if (!existingCourses.has(request.course)) continue;

    shownAny = true;

    const learnerRef = doc(db, "students", request.learnerId);
    const learnerSnap = await getDoc(learnerRef);
    const learnerName = learnerSnap.exists() ? learnerSnap.data().name : "Unknown";

    // Normalize status and display nicely
    const normalizedStatus = (request.status || "pending").toLowerCase();
    const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    let statusHtml = `<p><strong>Status:</strong> ${displayStatus}</p>`;
    let buttonsHtml = "";
    if (normalizedStatus === "pending") {
      buttonsHtml = `
        <button class="btn accept-btn" data-id="${requestId}">✅ Accept</button>
        <button class="btn reject-btn" data-id="${requestId}">❌ Reject</button>
      `;
    }

    const card = document.createElement("div");
    card.className = "notification-card";
    card.innerHTML = `
      <p><strong>From:</strong> ${learnerName}</p>
      <p><strong>Course:</strong> ${request.course}</p>
      <p><strong>Message:</strong> ${request.message || "No additional message"}</p>
      ${statusHtml}
      <div class="action-buttons">${buttonsHtml}</div>
    `;
    learnerRequestsContainer.appendChild(card);
  }

  if (!shownAny) {
    learnerRequestsContainer.innerHTML = "<p>No active requests for existing courses.</p>";
  }

  document.querySelectorAll(".accept-btn").forEach(btn =>
    btn.addEventListener("click", () => updateRequestStatus(btn.dataset.id, "Accepted"))
  );
  document.querySelectorAll(".reject-btn").forEach(btn =>
    btn.addEventListener("click", () => updateRequestStatus(btn.dataset.id, "Rejected"))
  );
}

// Update Request Status and Notify Learner
async function updateRequestStatus(requestId, status) {
  try {
    const requestRef = doc(db, "tutorRequests", requestId);
    await updateDoc(requestRef, { status });

    // Notify learner about acceptance/rejection
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;

    const requestData = requestSnap.data();
    const learnerId = requestData.learnerId;

    // Add notification for learner
    await addDoc(collection(db, "notifications"), {
      uid: learnerId,
      message: `Your tutoring request for ${requestData.course} has been ${status.toLowerCase()}.`,
      timestamp: new Date(),
      read: false
    });

    loadLearnerRequests();
  } catch (err) {
    console.error("Failed to update request status:", err);
  }
}

// Logout Button Handler
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/login.html";
  });
}
