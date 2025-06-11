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
const successBox = document.createElement("div");
successBox.id = "successBox";
document.body.appendChild(successBox);

// Form Fields
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

// Form Submit
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
    setTimeout(() => (messageBox.textContent = ""), 3000);
    return;
  }

  try {
    if (editingPostId) {
      await updateDoc(doc(db, "tutorPosts", editingPostId), {
        days, startTime, endTime, description, location
      });
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
    setTimeout(() => (messageBox.textContent = ""), 3000);

    tutorForm.reset();
    loadTutorPosts();
  } catch (err) {
    console.error("Error:", err);
    messageBox.textContent = "❌ Error while processing.";
    messageBox.className = "error-msg";
    setTimeout(() => (messageBox.textContent = ""), 3000);
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

  for (const docSnap of snapshot.docs) {
    const post = docSnap.data();
    const postId = docSnap.id;
    const course = post.course;

    const enrollSnap = await getDocs(query(
      collection(db, "courseEnrollments"),
      where("tutorId", "==", currentUID),
      where("course", "==", course)
    ));

    let enrolledHTML = "";
    if (!enrollSnap.empty) {
      enrolledHTML += `
        <table class="enrolled-table">
          <thead>
            <tr><th>Name</th><th>ID</th><th>Contact</th><th>Requested At</th><th>Actions</th></tr>
          </thead><tbody>`;
      enrollSnap.forEach(enr => {
        const d = enr.data();
        enrolledHTML += `
          <tr>
            <td>${d.learnerName}</td>
            <td>${d.iubId}</td>
            <td>${d.contact}</td>
            <td>${new Date(d.requestTime.seconds * 1000).toLocaleString()}</td>
            <td>
              <button class="btn chat-btn">💬</button>
              <button class="btn remove-btn" data-id="${enr.id}">❌</button>
            </td>
          </tr>`;
      });
      enrolledHTML += `</tbody></table>`;
    }

    const div = document.createElement("div");
    div.className = "notification-card tutor-post";
    div.innerHTML = `
      <p><strong>Course:</strong> ${course}</p>
      <p><strong>Days:</strong> ${post.days.join(", ")}</p>
      <p><strong>Time:</strong> ${formatTime(post.startTime)} - ${formatTime(post.endTime)}</p>
      <p><strong>Location:</strong> ${post.location || "Not specified"}</p>
      <p><strong>Description:</strong> ${post.description || "None"}</p>

      <button class="btn toggle-details">📂 Course Details (${enrollSnap.size})</button>
      <div class="course-details" style="display:none;">
        ${enrolledHTML || "<p>No enrolled learners yet.</p>"}
      </div>

      <div class="action-buttons">
        <button class="btn edit-btn" data-id="${postId}" data-course="${course}">✏ Edit</button>
        <button class="btn delete-btn" data-id="${postId}">🗑 Delete</button>
      </div>
    `;

    tutorPostList.appendChild(div);
  }

  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => startEditPost(btn.dataset.id, btn.dataset.course))
  );
  document.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteTutorPost(btn.dataset.id))
  );
  document.querySelectorAll(".toggle-details").forEach(btn =>
    btn.addEventListener("click", () => {
      const box = btn.nextElementSibling;
      box.style.display = box.style.display === "none" ? "block" : "none";
    })
  );
  document.querySelectorAll(".remove-btn").forEach(btn =>
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "courseEnrollments", btn.dataset.id));
      showSuccessMsg("👤 Learner removed.");
      loadTutorPosts();
    })
  );
}

// Edit Post
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
  messageBox.textContent = "📝 Editing mode.";
}

// Delete Post
async function deleteTutorPost(postId) {
  if (confirm("Delete this post?")) {
    await deleteDoc(doc(db, "tutorPosts", postId));
    showSuccessMsg("🗑️ Post deleted.");
    loadTutorPosts();
    loadLearnerRequests();
  }
}

// Notifications
function showNotifications(name) {
  const today = new Date();
  const weekday = today.toLocaleString("en-US", { weekday: "long" });

  notificationBox.innerHTML = `
    <div class="notification-card">
      <p>📢 Hello ${name}, welcome to your tutor panel.</p>
      <p>📅 ${today.toLocaleDateString()}</p>
      <p>📘 Keep your availability updated.</p>
    </div>`;

  checkTodayTuition(weekday);
}

async function checkTodayTuition(today) {
  const q = query(collection(db, "tutorPosts"), where("uid", "==", currentUID));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    if (post.days.includes(today)) {
      const div = document.createElement("div");
      div.className = "notification-card highlight";
      div.innerHTML = `
        <p>📌 Reminder: You're available today (${today})</p>
        <p>🕒 ${post.startTime} - ${post.endTime} for ${post.course}</p>`;
      notificationBox.appendChild(div);
    }
  });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Load Requests
async function loadLearnerRequests() {
  if (!learnerRequestsContainer) return;
  learnerRequestsContainer.innerHTML = "";

  const tutorCourses = new Set();
  const postSnap = await getDocs(query(collection(db, "tutorPosts"), where("uid", "==", currentUID)));
  postSnap.forEach(doc => tutorCourses.add(doc.data().course));

  const reqSnap = await getDocs(query(collection(db, "tutorRequests"), where("tutorId", "==", currentUID)));
  if (reqSnap.empty) {
    learnerRequestsContainer.innerHTML = "<p>No requests found.</p>";
    return;
  }

  let shownAny = false;
  for (const docSnap of reqSnap.docs) {
    const request = docSnap.data();
    const requestId = docSnap.id;
    if (!tutorCourses.has(request.course)) continue;
    if (request.status && request.status !== "pending") continue;

    shownAny = true;
    const learnerRef = doc(db, "students", request.learnerId);
    const learnerSnap = await getDoc(learnerRef);
    const learnerName = learnerSnap.exists() ? learnerSnap.data().name : "Unknown";

    const card = document.createElement("div");
    card.className = "notification-card";
    card.innerHTML = `
      <p><strong>From:</strong> ${learnerName}</p>
      <p><strong>Course:</strong> ${request.course}</p>
      <p><strong>Message:</strong> ${request.message || "N/A"}</p>
      <div class="action-buttons">
        <button class="btn accept-btn" data-id="${requestId}">✅ Accept</button>
        <button class="btn reject-btn" data-id="${requestId}">❌ Reject</button>
      </div>
    `;
    learnerRequestsContainer.appendChild(card);
  }

  if (!shownAny) learnerRequestsContainer.innerHTML = "<p>No active requests.</p>";

  document.querySelectorAll(".accept-btn").forEach(btn =>
    btn.addEventListener("click", () => updateRequestStatus(btn.dataset.id, "Accepted"))
  );
  document.querySelectorAll(".reject-btn").forEach(btn =>
    btn.addEventListener("click", () => updateRequestStatus(btn.dataset.id, "Rejected"))
  );
}

// Accept/Reject + Enroll
async function updateRequestStatus(requestId, status) {
  try {
    const ref = doc(db, "tutorRequests", requestId);
    await updateDoc(ref, { status });

    const reqSnap = await getDoc(ref);
    const req = reqSnap.data();
    const learnerId = req.learnerId;

    await addDoc(collection(db, "notifications"), {
      uid: learnerId,
      message: `Your request for ${req.course} was ${status.toLowerCase()}.`,
      timestamp: new Date(),
      read: false
    });

    if (status === "Accepted") {
      const learnerSnap = await getDoc(doc(db, "students", learnerId));
      const data = learnerSnap.data() || {};
      await addDoc(collection(db, "courseEnrollments"), {
        tutorId: currentUID,
        course: req.course,
        learnerId,
        learnerName: data.name || "Unknown",
        iubId: data.iubId || "N/A",
        contact: data.contact || "N/A",
        requestTime: req.timestamp || new Date()
      });
    }

    showSuccessMsg(`✅ Request ${status.toLowerCase()}!`);
    loadLearnerRequests();
    loadTutorPosts();
  } catch (err) {
    console.error("Error updating request:", err);
  }
}

// Toast
function showSuccessMsg(text) {
  successBox.textContent = text;
  successBox.className = "success-toast";
  setTimeout(() => {
    successBox.textContent = "";
    successBox.className = "";
  }, 3000);
}
