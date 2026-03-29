// index.js - FINAL (preview + modal fix)
const BASE_API_URL = '/SmartAttendance/api';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // === 1. FETCH CURRENT CLASS SESSION ===
  const updateClassSession = async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/session/current.php`);
      const data = await res.json();

      if (data.status === 'no_class') {
        document.getElementById('class-subject').textContent = 'No Class';
        document.getElementById('class-teacher').textContent = '-';
        document.getElementById('class-time-range').textContent = '-';
        document.getElementById('class-room').textContent = '-';
        document.getElementById('class-time-status').textContent = 'N/A';
        document.getElementById('class-live-status').textContent = 'NO CLASS TODAY';
        
        const select = document.getElementById('select-class-manual');
        if (select) select.disabled = true;
        return;
      }

      document.getElementById('class-subject').textContent = `${data.class.subject_code} (${data.class.subject_name})`;
      document.getElementById('class-teacher').textContent = data.class.teacher;
      document.getElementById('class-time-range').textContent = `${data.class.start_time} - ${data.class.end_time}`;
      document.getElementById('class-room').textContent = data.class.room;

      const updateRemainingTime = () => {
        try {
          const now = new Date();
          const [startH, startM] = data.class.start_time.split(':').map(Number);
          const [endH, endM] = data.class.end_time.split(':').map(Number);
          
          const start = new Date();
          start.setHours(startH, startM, 0);
          
          const end = new Date();
          end.setHours(endH, endM, 0);
          
          let diffMs, status;
          if (now < start) {
            diffMs = start - now;
            status = 'upcoming';
          } else if (now <= end) {
            diffMs = end - now;
            status = 'active';
          } else {
            diffMs = 0;
            status = 'ended';
          }

          let remaining = '00:00';
          if (diffMs > 0) {
            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            remaining = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }

          document.getElementById('class-time-status').textContent = remaining;
          
          const statusEl = document.getElementById('class-live-status');
          statusEl.textContent = status.toUpperCase();
          if (status === 'active') {
            statusEl.parentElement.className = 'status-box w-full md:w-1/2 bg-green-100 border border-green-200';
          } else if (status === 'upcoming') {
            statusEl.parentElement.className = 'status-box w-full md:w-1/2 bg-blue-100 border border-blue-200';
          } else {
            statusEl.parentElement.className = 'status-box w-full md:w-1/2 bg-red-100 border border-red-200';
          }
        } catch (e) {
          console.warn('Time update failed', e);
        }
      };

      updateRemainingTime();
      const interval = setInterval(updateRemainingTime, 1000);
      if (window.classInterval) clearInterval(window.classInterval);
      window.classInterval = interval;

      const select = document.getElementById('select-class-manual');
      if (select && data.class && data.class.id) {
        select.disabled = false;
        const optionExists = Array.from(select.options).some(opt => opt.value == data.class.id);
        if (optionExists) {
          select.value = data.class.id;
        } else if (select.options.length > 0) {
          select.value = select.options[0].value;
        }
      }

    } catch (e) {
      console.warn('Fetch class failed', e);
      const select = document.getElementById('select-class-manual');
      if (select) select.disabled = true;
    }
  };

  // === 2. POPULATE CLASS DROPDOWN ===
  const populateClassDropdown = async () => {
    try {
      const today = new Date().getDay();
      const dayMap = { 6: 'Sat', 0: 'Sun', 1: 'Mon', 3: 'Wed', 4: 'Thu' };
      const day = dayMap[today];

      const url = day ? `${BASE_API_URL}/classes.php?day=${day}` : `${BASE_API_URL}/classes.php`;
      const res = await fetch(url);
      const classes = await res.json();
      
      const select = document.getElementById('select-class-manual');
      if (!select) return;

      select.innerHTML = '';
      if (!day || classes.length === 0) {
        const opt = new Option('No class today', '', true, true);
        opt.disabled = true;
        select.appendChild(opt);
        select.disabled = true;
        return;
      }

      classes.forEach(cls => {
        select.appendChild(new Option(cls.label, cls.value));
      });

      select.disabled = false;
      select.value = classes[0].value;

    } catch (e) {
      console.warn('Dropdown failed', e);
    }
  };

  // === 3. DATE/TIME ===
  const updateDateTime = () => {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('current-day').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', { hour12: true });
  };

  // === 4. STUDENT PREVIEW (FIXED) ===
  const renderHomeAttendancePreview = (attendanceObj, totalCount) => {
    const grid = document.getElementById('home-attendance-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const count = totalCount || 60;
    const ids = attendanceObj ? Object.keys(attendanceObj).map(k => parseInt(k,10)).sort((a,b)=>a-b) : 
                Array.from({length:count}, (_,i) => 111124001 + i);

    for (let id of ids.slice(0, Math.min(count, 60))) {
      const status = attendanceObj && attendanceObj[id] ? attendanceObj[id] : 'pending';
      const tile = document.createElement('div');
      tile.classList.add('attendance-tile', 
        status === 'present' ? 'attendance-tile-present' : 'attendance-tile-pending',
        'attendance-tile-readonly'
      );
      tile.textContent = String(id).slice(-3);
      tile.setAttribute('aria-label', `ID ${id} ${status}`);
      grid.appendChild(tile);
    }
  };

  // === INITIAL LOAD ===
  populateClassDropdown();
  updateClassSession();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  setInterval(updateClassSession, 5000);

  // === 5. ATTENDANCE SUMMARY (FIXED) ===
  const updateSummary = async () => {
    try {
      const latest = findLatestAttendanceData();
      if (latest) {
        const attendance = latest.attendance || {};
        const total = Object.keys(attendance).length || 60;
        const present = Object.values(attendance).filter(s => s === 'present').length;
        const absent = total - present;
        const percent = total > 0 ? ((present/total)*100).toFixed(1) : '0.0';
        setSummary(total, present, absent, `${percent}%`);
        renderHomeAttendancePreview(attendance, total);
      } else {
        setSummary(60, 0, 60, '0.0%');
        renderHomeAttendancePreview(null, 60);
      }
    } catch (e) {
      console.warn('Update summary failed', e);
    }
  };

  const setSummary = (total, present, absent, percentText) => {
    document.getElementById('total-students').textContent = total;
    document.getElementById('attended-students').textContent = present;
    document.getElementById('absent-students').textContent = absent;
    document.getElementById('attendance-percentage').textContent = percentText;
  };

  const findLatestAttendanceData = () => {
    const prefix = 'attendance_';
    let latest = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        const ts = parsed.timestamp ? new Date(parsed.timestamp).getTime() : 0;
        if (!latest || ts > latest._ts) {
          parsed._ts = ts;
          latest = parsed;
        }
      } catch (e) {}
    }
    return latest;
  };

  // Initial load
  updateSummary();
  setInterval(updateSummary, 5000);
});