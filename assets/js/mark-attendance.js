// mark-attendance.js - FINAL (modal + preview fix)
const BASE_API_URL = '/SmartAttendance/api';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // ✅ GET CLASS ID (fallback to 7)
  const getClassId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('class_id');
    return (id && !isNaN(id)) ? id : '7';
  };

  // === 1. FETCH CLASS INFO ===
  const fetchClassInfo = async (classId) => {
    try {
      const res = await fetch(`${BASE_API_URL}/class.php?id=${classId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      return { subject_code: 'AS', subject_name: 'Applied Statistics', teacher: 'Alamin' };
    }
  };

  // === 2. FETCH STUDENTS ===
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/students.php`);
      const ids = await res.json();
      return ids.map(id => ({ id, student_code: String(id).slice(-3) }));
    } catch (e) {
      return [101,102,103,104,105,107,108,109,110,111].map(id => ({ 
        id, 
        student_code: String(id).padStart(3, '0') 
      }));
    }
  };

  let attendanceStatus = {};
  let studentList = [];

  // === 3. INITIALIZE ===
  const initialize = async () => {
    const classId = getClassId();
    try {
      const classInfo = await fetchClassInfo(classId);
      document.getElementById('class-header').textContent = 
        `${classInfo.subject_code} • ${classInfo.subject_name}`;
      
      studentList = await fetchStudents();
      attendanceStatus = {};
      studentList.forEach(s => attendanceStatus[s.id] = 'pending');
      
      renderStudentTiles();
      updateStats();
    } catch (e) {
      console.error('Init failed', e);
    }
  };

  // === 4. STATS & RENDER ===
  const updateStats = () => {
    const present = Object.values(attendanceStatus).filter(s => s === 'present').length;
    const total = studentList.length;
    document.getElementById('present-count').textContent = present;
    document.getElementById('absent-count').textContent = total - present;
    document.getElementById('total-count').textContent = total;
    document.getElementById('attendance-percent').textContent = 
      total ? `${((present/total)*100).toFixed(1)}%` : '0.0%';
  };

  const renderStudentTiles = () => {
    const grid = document.getElementById('student-grid');
    grid.innerHTML = '';
    studentList.forEach(s => {
      const tile = document.createElement('div');
      tile.className = 'attendance-tile attendance-tile-pending';
      tile.textContent = s.student_code;
      tile.addEventListener('click', () => {
        const isPresent = attendanceStatus[s.id] !== 'present';
        tile.classList.toggle('attendance-tile-present', isPresent);
        attendanceStatus[s.id] = isPresent ? 'present' : 'pending';
        updateStats();
      });
      grid.appendChild(tile);
    });
  };

  // === 5. SAVE (MODAL FIX) ===
  document.getElementById('save-button').addEventListener('click', async () => {
    const payload = {
      class_id: parseInt(getClassId()),
      attendance: Object.entries(attendanceStatus).map(([id, status]) => ({
        student_id: parseInt(id),
        status
      }))
    };

    try {
      const res = await fetch(`${BASE_API_URL}/attendance/save.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        // ✅ SHOW MODAL (not alert)
        document.getElementById('success-modal').classList.remove('hidden');
      } else {
        alert('❌ Save failed');
      }
    } catch (e) {
      alert('⚠️ Network error');
    }
  });

  // === 6. MODAL CLOSE ===
  document.getElementById('modal-close-button').addEventListener('click', () => {
    document.getElementById('success-modal').classList.add('hidden');
    window.location.href = 'index.html';
  });

  // Start
  initialize();
});