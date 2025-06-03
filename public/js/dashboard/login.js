// js/dashboard/login.js

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const role = document.getElementById("role").value;
  const iubId = document.getElementById("iubId").value.trim();
  const password = document.getElementById("password").value;
  const successMsg = document.getElementById("loginSuccess");

  // Admin override
  if (role === "Admin" && iubId === "Jubair" && password === "1020") {
    successMsg.textContent = "✅ Welcome Admin! Redirecting...";
    successMsg.style.color = "#16a34a";
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 1500);
    return;
  }

  // Simulated success for now
  if (iubId && password && role !== "") {
    successMsg.textContent = "✅ Login successful! Redirecting...";
    successMsg.style.color = "#16a34a";
    setTimeout(() => {
      window.location.href = `dashboard/${role.toLowerCase()}.html`; // example
    }, 1500);
  } else {
    successMsg.textContent = "❌ Please fill all fields.";
    successMsg.style.color = "#dc2626";
  }
});
