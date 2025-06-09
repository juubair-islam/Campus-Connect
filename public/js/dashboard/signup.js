import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const matchMsg = document.getElementById('passwordMatch');
  const successMsg = document.getElementById('successMessage');
  const loadingOverlay = document.getElementById('loadingOverlay');

  const alumniFields = document.getElementById('alumniFields');
  const facultyFields = document.getElementById('facultyFields');
  const studentFields = document.getElementById('studentFields');
  const roleOptions = document.querySelectorAll('input[name="role"]');

  const facultyPassword = document.getElementById('facultypassword');
  const facultyConfirmPassword = document.getElementById('facultyconfirmPassword');
  const facultyMatchMsg = document.getElementById('facultypasswordMatch');

  // Show/hide fields based on role
  roleOptions.forEach(option => {
    option.addEventListener('change', () => {
      const role = option.value.toLowerCase();
      alumniFields.style.display = role === 'alumni' ? 'block' : 'none';
      facultyFields.style.display = role === 'faculty/administrative officer' ? 'block' : 'none';
      studentFields.style.display = (role === 'student' || role === 'alumni') ? 'block' : 'none';
    });
  });

  // Student/Alumni password match feedback
  confirmPassword.addEventListener('input', () => {
    matchMsg.textContent = password.value === confirmPassword.value
      ? "✅ Passwords match." : "❌ Passwords do not match.";
    matchMsg.style.color = password.value === confirmPassword.value ? "#16a34a" : "#dc2626";
  });

  // Faculty password match feedback
  facultyConfirmPassword.addEventListener('input', () => {
    facultyMatchMsg.textContent = facultyPassword.value === facultyConfirmPassword.value
      ? "✅ Passwords match." : "❌ Passwords do not match.";
    facultyMatchMsg.style.color = facultyPassword.value === facultyConfirmPassword.value ? "#16a34a" : "#dc2626";
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loadingOverlay.style.display = 'flex';

    const selectedRole = [...roleOptions].find(r => r.checked)?.value || 'student';
    const role = selectedRole.toLowerCase();
    const isStudentOrAlumni = role === 'student' || role === 'alumni';
    const isFaculty = role.includes('faculty');

    const email = isFaculty
      ? document.getElementById('facultyEmail').value.trim()
      : document.getElementById('email').value.trim();

    const name = isFaculty
      ? document.getElementById('facultyName').value.trim()
      : document.getElementById('name').value.trim();

    const pwd = isFaculty ? facultyPassword.value : password.value;
    const confirmPwd = isFaculty ? facultyConfirmPassword.value : confirmPassword.value;

    if (!email.endsWith('@iub.edu.bd')) {
      alert("Email must end with @iub.edu.bd");
      loadingOverlay.style.display = 'none';
      return;
    }

    if (pwd !== confirmPwd) {
      alert("Passwords do not match!");
      loadingOverlay.style.display = 'none';
      return;
    }

    try {
      // ✅ Create Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
      const uid = userCredential.user.uid;

      // ✅ Store in role-based collection using uid as doc ID
      const collectionName = isFaculty ? "faculty" : (role === 'alumni' ? "alumni" : "students");
      const userDocRef = doc(db, collectionName, uid);

      const userData = {
        uid,
        name,
        email,
        role: selectedRole,
        createdAt: new Date()
      };

      if (isStudentOrAlumni) {
        userData.iubId = document.getElementById("iubId").value.trim();
        userData.department = document.getElementById("department").value;
        userData.major = document.getElementById("major").value;
        userData.minor = document.getElementById("minor")?.value || "";
        userData.contact = document.getElementById("contact").value.trim();
      }

      if (role === 'alumni') {
        userData.residence = document.getElementById("residence").value;
        userData.company = document.getElementById("company").value;
        userData.designation = document.getElementById("designation").value;
        userData.companyAddress = document.getElementById("companyAddress").value;
        userData.gradYear = document.getElementById("gradYear").value;
      }

      if (isFaculty) {
        userData.employeeId = document.getElementById("employeeId").value;
        userData.department = document.getElementById("facultyDepartment").value;
        userData.contact = document.getElementById("facultyContact").value;
      }

      // Save the user profile with uid as doc ID
      await setDoc(userDocRef, userData);

      successMsg.innerHTML = `<strong> Congrats, ${name}!</strong><br>You are now connected with the campus.`;
      successMsg.style.display = "block";
      successMsg.style.color = "#15803d";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    } catch (err) {
      alert("Error during signup: " + err.message);
    } finally {
      loadingOverlay.style.display = 'none';
    }
  });
});
