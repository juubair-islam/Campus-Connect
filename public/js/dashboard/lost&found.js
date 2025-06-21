// Firebase config & initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, orderBy, query, setDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let items = [];
let currentEditIndex = null;
let uploadedImageData = '';
let currentUserUID = null;


let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserUID = user.uid;
    const userRef = doc(db, "users", currentUserUID);
    const userSnap = await getDoc(userRef);
    const nameHeader = document.getElementById("studentNameHeader");

    if (nameHeader) {
      if (userSnap.exists()) {
        currentUserData = userSnap.data();
        nameHeader.textContent = currentUserData.name || "User";

        // Prefill founder fields
        document.getElementById('founderName').value = currentUserData.name || '';
        document.getElementById('founderID').value = currentUserUID || '';
        document.getElementById('founderContact').value = currentUserData.contact || '';

        // Optional: disable founder fields to prevent editing
        document.getElementById('founderName').disabled = true;
        document.getElementById('founderID').disabled = true;
        document.getElementById('founderContact').disabled = true;

      } else {
        currentUserData = null;
        nameHeader.textContent = "User";
      }
    }

    loadUserItems();
  } else {
    alert('Please login to access Lost & Found.');
    window.location.href = "../login.html";
  }
});


// UI event handlers
document.getElementById('addBtn').onclick = togglePages;
document.getElementById('backBtn').onclick = togglePages;
document.getElementById('searchBtn').onclick = searchItems;
document.getElementById('excelBtn').onclick = exportToExcel;
document.getElementById('pdfBtn').onclick = exportToPDF;
document.getElementById('submitItem').onclick = addItem;
document.getElementById('closePopup').onclick = closePopup;
document.getElementById('submitCollection').onclick = submitCollection;

// Auth Check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserUID = user.uid;

    // Fetch user's name from Firestore
    const userRef = doc(db, "users", currentUserUID);
    const userSnap = await getDoc(userRef);
    const nameHeader = document.getElementById("studentNameHeader");

    if (nameHeader) {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        nameHeader.textContent = userData.name || "User";
      } else {
        nameHeader.textContent = "User";
      }
    }

    loadUserItems();
  } else {
    alert('Please login to access Lost & Found.');
    window.location.href = "/login.html";
  }
});

async function loadUserItems() {
  const userCollection = collection(db, "users", currentUserUID, "lostAndFound");
  const q = query(userCollection, orderBy("sl"));
  const snapshot = await getDocs(q);

  items = [];
  snapshot.forEach(doc => items.push(doc.data()));
  renderTable();
}

async function saveUserItems() {
  const userCollection = collection(db, "users", currentUserUID, "lostAndFound");
  const batch = writeBatch(db);

  const snapshot = await getDocs(userCollection);
  snapshot.forEach(doc => batch.delete(doc.ref));

  items.forEach(item => {
    const itemRef = doc(db, "users", currentUserUID, "lostAndFound", item.sl.toString());
    batch.set(itemRef, item);
  });

  try {
    await batch.commit();
    console.log("Items saved successfully");
  } catch (err) {
    console.error("Error saving items:", err);
  }
}

function togglePages() {
  const p1 = document.getElementById('page1');
  const p2 = document.getElementById('page2');
  if (p1.style.display === 'none') {
    p1.style.display = 'block';
    p2.style.display = 'none';
  } else {
    p1.style.display = 'none';
    p2.style.display = 'block';
    document.getElementById('newSL').value = items.length + 1;
    document.getElementById('newDate').value = new Date().toISOString().slice(0, 10);
  }
}

function addItem() {
  const file = document.getElementById('imageUpload').files[0];
  if (!file) {
    alert('Please upload an image.');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 200;
      canvas.getContext('2d').drawImage(img, 0, 0, 200, 200);
      uploadedImageData = canvas.toDataURL('image/png');

      const item = {
        sl: items.length + 1,
        date: new Date().toISOString().slice(0, 10),
        name: document.getElementById('itemName').value,
        desc: document.getElementById('description').value,
        image: uploadedImageData,
        place: document.getElementById('foundPlace').value,
        founder: {
          name: document.getElementById('founderName').value,
          id: document.getElementById('founderID').value,
          contact: document.getElementById('founderContact').value
        },
        collected: null
      };

      items.push(item);
      renderTable();
      saveUserItems();
      togglePages();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderTable() {
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.sl}</td>
        <td>${item.date}</td>
        <td>${item.name}</td>
        <td>${item.desc}</td>
        <td><img src="${item.image}" class="picture-preview"></td>
        <td>${item.place}</td>
        <td>${item.founder.name} (${item.founder.id})<br>${item.founder.contact}</td>
        <td>${item.collected
          ? `${item.collected.name} (${item.collected.id})<br>${item.collected.contact}`
          : 'Not Found Yet'}</td>
        <td>${item.collected
          ? `<button class="details-btn" onclick="alert('Collected By: ${item.collected.name} (${item.collected.id})\\nContact: ${item.collected.contact}')">Details</button>`
          : `<button class="status-btn" onclick="openPopup(${index})">Found</button>`}</td>
      </tr>`;
  });
}

function openPopup(idx) {
  currentEditIndex = idx;
  document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
  document.getElementById('popup').style.display = 'none';
  ['collectedName', 'collectedID', 'collectedContact'].forEach(id => document.getElementById(id).value = '');
}

function submitCollection() {
  const name = document.getElementById('collectedName').value.trim();
  const id = document.getElementById('collectedID').value.trim();
  const contact = document.getElementById('collectedContact').value.trim();
  if (!name || !id || !contact) {
    alert('Please fill in all fields.');
    return;
  }
  items[currentEditIndex].collected = { name, id, contact };
  closePopup();
  renderTable();
  saveUserItems();
}

function searchItems() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.filter(item => item.name.toLowerCase().includes(q)).forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.sl}</td>
        <td>${item.date}</td>
        <td>${item.name}</td>
        <td>${item.desc}</td>
        <td><img src="${item.image}" class="picture-preview"></td>
        <td>${item.place}</td>
        <td>${item.founder.name} (${item.founder.id})<br>${item.founder.contact}</td>
        <td>${item.collected
          ? `${item.collected.name} (${item.collected.id})<br>${item.collected.contact}`
          : 'Not Found Yet'}</td>
        <td>${item.collected
          ? `<button class="details-btn" onclick="alert('Collected By: ${item.collected.name} (${item.collected.id})\\nContact: ${item.collected.contact}')">Details</button>`
          : `<button class="status-btn" onclick="openPopup(${index})">Found</button>`}</td>
      </tr>`;
  });
}

function exportToExcel() {
  const ws = XLSX.utils.json_to_sheet(items.map(i => ({
    SL: i.sl,
    Date: i.date,
    Name: i.name,
    Description: i.desc,
    Place: i.place,
    FoundBy: `${i.founder.name} (${i.founder.id})`,
    FounderContact: i.founder.contact,
    CollectedBy: i.collected ? `${i.collected.name} (${i.collected.id})` : '',
    CollectedContact: i.collected ? i.collected.contact : ''
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'LostAndFound');
  XLSX.writeFile(wb, 'LostAndFound_IUB.xlsx');
}

async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const table = document.getElementById('itemsTable');
  const cloned = table.cloneNode(true);
  cloned.style.position = 'absolute';
  cloned.style.top = '-9999px';
  document.body.appendChild(cloned);
  const canvas = await html2canvas(cloned, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('landscape', 'pt', 'a4');
  const pw = pdf.internal.pageSize.getWidth() - 40;
  const ph = (canvas.height * pw) / canvas.width;
  pdf.addImage(imgData, 'PNG', 20, 20, pw, ph);
  pdf.save('LostAndFound_IUB.pdf');
  cloned.remove();
}
window.openPopup = openPopup;
window.closePopup = closePopup;
window.submitCollection = submitCollection;
