async function lookup() {
  const studentId = document.getElementById('studentId').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = 'Loading...';

  if (!studentId) {
    resultDiv.innerHTML = '<p>Please enter a Student ID.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/student/${studentId}`);
    if (!res.ok) throw new Error('Student not found');
    const data = await res.json();
    const student = data.data;
    const name = student.studentName || 'Unknown';

    let html = `<h2>Details for: ${name}</h2>`;
    html += `<div class="details-grid">`;
    for (const [key, value] of Object.entries(student)) {
      html += `
        <div class="details-item">
          <strong>${formatLabel(key)}</strong>
          <span>${value || '-'}</span>
        </div>`;
    }
    html += `</div>`;
    resultDiv.innerHTML = html;
  } catch (err) {
    resultDiv.innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Id$/, 'ID');
}

document.getElementById('studentId').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookup();
});
