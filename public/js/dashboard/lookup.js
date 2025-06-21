async function lookup() {
  const studentId = document.getElementById('studentId').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = 'Loading...';

  if (!studentId) {
    resultDiv.innerHTML = '<p>Please enter a Student ID.</p>';
    return;
  }

  const username = 'jubair';
  const password = '102';

  try {
    const res = await fetch(`/api/student/${studentId}`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    });

    if (!res.ok) throw new Error('Student not found or authentication failed');

    const data = await res.json();

    const student = data.data;
    const studentName = student.studentName || 'Unknown Student';

    let html = `<h2>Student Details for: ${studentName}</h2>`;
    html += `<div class="details-grid">`;
    for (const [key, value] of Object.entries(student)) {
      const label = formatLabel(key);
      const highlightClass = (key.toLowerCase() === 'cgpa' || key.toLowerCase() === 'earnedcredit') ? 'highlight' : '';

      html += `
        <div class="details-item ${highlightClass}">
          <strong>${label}</strong>
          <span>${value || '-'}</span>
        </div>`;
    }
    html += `</div>`;

    resultDiv.innerHTML = html;
  } catch (err) {
    resultDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}

document.getElementById('studentId').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    lookup();
  }
});

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Id$/, 'ID');
}
