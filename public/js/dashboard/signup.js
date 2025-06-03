  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    // Show/hide fields based on role
    roleOptions.forEach(option => {
      option.addEventListener('change', () => {
        const role = option.value.toLowerCase();
        alumniFields.style.display = role === 'alumni' ? 'block' : 'none';
        facultyFields.style.display = role === 'faculty/administrative officer' ? 'block' : 'none';
        studentFields.style.display = (role === 'student' || role === 'alumni') ? 'block' : 'none';
      });
    });

    // Password match feedback
    confirmPassword.addEventListener('input', () => {
      if (password.value !== confirmPassword.value) {
        matchMsg.textContent = "❌ Passwords do not match.";
        matchMsg.style.color = "#dc2626";
      } else {
        matchMsg.textContent = "✅ Passwords match.";
        matchMsg.style.color = "#16a34a";
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      loadingOverlay.style.display = 'flex';

      const selectedRole = [...roleOptions].find(r => r.checked)?.value || 'student';
      const role = selectedRole.toLowerCase();
      const isStudentOrAlumni = role === 'student' || role === 'alumni';
      const isFaculty = role.includes('faculty');

      const email = document.getElementById(isFaculty ? 'facultyEmail' : 'email').value.trim();
      const name = document.getElementById(isFaculty ? 'facultyName' : 'name').value.trim();
      const pwd = password.value;

      if (!email.endsWith('@iub.edu.bd')) {
        alert("Email must end with @iub.edu.bd");
        loadingOverlay.style.display = 'none';
        return;
      }

      if (pwd !== confirmPassword.value) {
        alert("Passwords do not match!");
        loadingOverlay.style.display = 'none';
        return;
      }

      try {
        const collectionName = isFaculty ? "faculty" : (role === 'alumni' ? "alumni" : "students");
        const userRef = collection(db, collectionName);

        const q = query(userRef, where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          alert("Email already registered.");
          loadingOverlay.style.display = 'none';
          return;
        }

        const userData = {
          name,
          email,
          role: selectedRole,
          password: pwd,
          createdAt: new Date()
        };

        if (isStudentOrAlumni) {
          userData.iubId = document.getElementById("iubId").value;
          userData.department = document.getElementById("department").value;
          userData.major = document.getElementById("major").value;
          userData.minor = document.getElementById("minor")?.value || "";
          userData.contact = document.getElementById("contact").value;
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

        await addDoc(userRef, userData);

        successMsg.innerHTML = `<strong>🎉 Congrats, ${name}!</strong><br>You are now connected with the campus.`;
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
