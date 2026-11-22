
/* =====================================
   SCHOOL HUB - APPLICATION CORE
===================================== */

const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

let currentPage = "home";

/* =====================================
   LOCAL STORAGE
===================================== */

const STORAGE = {
  tasks: "schoolhub.tasks",
  focus: "schoolhub.focus",
  expenses: "schoolhub.expenses",
  budget: "schoolhub.budget",
  focusSession: "schoolhub.focusSession",
  notes: "schoolhub.notes",
  transactions: "schoolhub.transactions"
};

function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.warn("Gagal membaca:", key, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Gagal menyimpan:", key, error);
    return false;
  }
}

/* =====================================
   NAVIGATION
===================================== */

function navigate(pageName) {

  if (currentPage === pageName) return;

  const targetPage = document.getElementById(pageName);

  if (!targetPage) return;

  const tabTarget = pageName === "finance" ? "more" : pageName;

  tabs.forEach(tab => {
    const active = tab.dataset.page === tabTarget;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-current",
      active ? "page" : "false"
    );
  });

  pages.forEach(page => {
    page.classList.toggle(
      "active",
      page.id === pageName
    );
  });

  currentPage = pageName;
  document.body.dataset.page = pageName;

  const activePage = document.getElementById(pageName);
  document.body.classList.toggle("scrolled", Boolean(activePage && activePage.scrollTop > 6));

  if (navigator.vibrate) {
    navigator.vibrate(10);
  }

  if (pageName === "home") {
    updateHome();
  }

  if (pageName === "tasks") {
    renderTasks();
  }

  if (pageName === "focus") {
    renderFocusTimer();
  }

  if (pageName === "notes") {
    renderNotes();
  }

  if (pageName === "more") {
    updateMoreSummary();
  }

  if (pageName === "finance") {
    renderFinance();
  }

  const taskFab = document.getElementById("open-task-form");
  const notesFab = document.getElementById("open-note-form");
  const finFab = document.getElementById("open-fin-form");

  if (taskFab) taskFab.classList.toggle("visible", pageName === "tasks");
  if (notesFab) notesFab.classList.toggle("visible", pageName === "notes");
  if (finFab) finFab.classList.toggle("visible", pageName === "finance");
}

/* Navigasi tab utama */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    navigate(tab.dataset.page);
  });
});

/* Navigasi tombol akses cepat */

document.addEventListener("click", event => {

  const button = event.target.closest("[data-go]");

  if (!button) return;

  navigate(button.dataset.go);

});

/* =====================================
   DATE AND GREETING
===================================== */

const MONTHS = [
  "Januari", "Februari", "Maret",
  "April", "Mei", "Juni",
  "Juli", "Agustus", "September",
  "Oktober", "November", "Desember"
];

const DAYS = [
  "Minggu", "Senin", "Selasa",
  "Rabu", "Kamis", "Jumat", "Sabtu"
];

function updateGreeting() {

  const now = new Date();
  const hour = now.getHours();

  let greeting = "Selamat malam.";
  let subtitle = "Saatnya beristirahat dengan tenang.";

  if (hour >= 4 && hour < 11) {
    greeting = "Selamat pagi.";
    subtitle = "Awali harimu dengan hal baik.";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat siang.";
    subtitle = "Tetap produktif dan jaga semangatmu.";
  } else if (hour >= 15 && hour < 18) {
    greeting = "Selamat sore.";
    subtitle = "Selesaikan satu hal penting hari ini.";
  }

  document.getElementById("greeting-title")
    .textContent = greeting;

  document.getElementById("greeting-subtitle")
    .textContent = subtitle;

  document.getElementById("current-date")
    .textContent =
      `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`
        .toUpperCase();
}

/* =====================================
   DATE HELPERS
===================================== */

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {

  if (!value) return null;

  const parts = String(value).split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDeadline(value) {

  const date = parseLocalDate(value);

  if (!date) return "Tanpa tenggat";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diff = Math.round(
    (date - todayStart) / 86400000
  );

  if (diff < 0) return "Terlambat";
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff <= 7) return `${diff} hari lagi`;

  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/* =====================================
   FORMAT CURRENCY
===================================== */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function formatRupiah(value) {
  return rupiah.format(value || 0);
}

/* =====================================
   FOCUS SUMMARY
===================================== */

function updateFocusSummary() {

  const focus = readStorage(STORAGE.focus, {});

  const today = dateKey();

  // Hanya menghitung sesi hari ini
  const minutes = focus.date === today
    ? Math.max(0, Number(focus.minutes) || 0)
    : 0;

  const target = Math.max(
    1,
    Number(focus.targetMinutes) || 120
  );

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const percentage = Math.min(
    100,
    Math.round(minutes / target * 100)
  );

  document.getElementById("focus-hours")
    .textContent = String(hours).padStart(2, "0");

  document.getElementById("focus-minutes")
    .textContent = String(remainingMinutes).padStart(2, "0");

  document.getElementById("focus-percent")
    .textContent = `${percentage}%`;

  document.getElementById("focus-progress")
    .style.width = `${percentage}%`;

  document.getElementById("focus-ring")
    .style.background = `
      conic-gradient(
        from -90deg,
        #9CAEFF 0%,
        #B18CFF ${percentage}%,
        rgba(255,255,255,.09) ${percentage}%,
        rgba(255,255,255,.09) 100%
      )
    `;

  document.getElementById("focus-ring")
    .setAttribute("aria-label", `Progres fokus ${percentage}%`);

  document.getElementById("focus-status")
    .textContent = minutes > 0
      ? "Kamu sudah mulai produktif!"
      : "Belum ada sesi fokus";

  document.getElementById("focus-target")
    .textContent = `Target ${target / 60} jam`;
}

/* =====================================
   TASK SUMMARY
===================================== */

function updateTaskSummary() {

  const tasks = readStorage(STORAGE.tasks, []);

  const validTasks = Array.isArray(tasks) ? tasks : [];

  const pending = validTasks.filter(
    task => !task.completed
  );

  const completed = validTasks.filter(
    task => task.completed
  );

  document.getElementById("task-pending")
    .textContent = pending.length;

  document.getElementById("task-completed")
    .textContent = completed.length;

  renderUpcomingTasks(pending);

  if (typeof renderTasks === "function") {
    renderTasks();
  }
}

/* =====================================
   UPCOMING TASKS
===================================== */

function renderUpcomingTasks(tasks) {

  const container = document.getElementById("upcoming-tasks");

  // Urutkan berdasarkan deadline
  const upcoming = [...tasks]
    .filter(task => parseLocalDate(task.dueDate))
    .sort((a, b) => {
      return parseLocalDate(a.dueDate) -
             parseLocalDate(b.dueDate);
    })
    .slice(0, 3);

  if (upcoming.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24">
            <path d="M8 4h12v16H4V4h4Z"/>
            <path d="M8 2v4M16 2v4M4 9h16"/>
          </svg>
        </div>
        <strong>Belum ada tugas</strong>
        <p>Tugas yang kamu tambahkan akan muncul di sini.</p>
        <button class="small-action" data-go="tasks">
          Tambah tugas
        </button>
      </div>
    `;

    return;
  }

  container.innerHTML = upcoming.map(task => {

    const deadline = formatDeadline(task.dueDate);

    let deadlineClass = "";

    if (deadline === "Terlambat") {
      deadlineClass = "overdue";
    } else if (
      deadline === "Hari ini" ||
      deadline === "Besok"
    ) {
      deadlineClass = "urgent";
    }

    const title = escapeHTML(task.title || "Tanpa judul");
    const subject = escapeHTML(task.subject || "Umum");

    return `
      <article class="upcoming-item">

        <div class="task-subject-icon">
          <svg viewBox="0 0 24 24">
            <path d="M8 4h12v16H4V4h4Z"/>
            <path d="M8 2v4M16 2v4M4 9h16"/>
          </svg>
        </div>

        <div class="upcoming-content">
          <strong>${title}</strong>
          <span>${subject}</span>
        </div>

        <div class="task-deadline ${deadlineClass}">
          ${deadline}
        </div>

      </article>
    `;

  }).join("");
}

/* =====================================
   HTML ESCAPING
===================================== */

function escapeHTML(value) {

  return String(value).replace(/[&<>"']/g, char => {

    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}

/* =====================================
   FINANCE SUMMARY
===================================== */

function updateFinanceSummary() {

  const now = new Date();

  const expenses = getTransactions();

  const validExpenses = Array.isArray(expenses)
    ? expenses
    : [];

  // Ambil pengeluaran bulan dan tahun ini
  const monthlyExpenses = validExpenses.filter(item => {

    const date = parseLocalDate(item.date);

    return item.type !== "income" && date &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

  });

  const total = monthlyExpenses.reduce((sum, item) => {

    const amount = Number(item.amount);

    return sum + (
      Number.isFinite(amount) && amount > 0
        ? amount
        : 0
    );

  }, 0);

  const budget = Math.max(
    0,
    Number(readStorage(STORAGE.budget, 0)) || 0
  );

  const percentage = budget > 0
    ? Math.round(total / budget * 100)
    : 0;

  const progress = Math.min(100, percentage);

  document.getElementById("finance-month")
    .textContent = MONTHS[now.getMonth()];

  document.getElementById("finance-total")
    .textContent = formatRupiah(total);

  document.getElementById("finance-budget-text")
    .textContent = budget > 0
      ? formatRupiah(budget)
      : "Belum diatur";

  document.getElementById("finance-percent")
    .textContent = budget > 0
      ? `${percentage}%`
      : "—";

  document.getElementById("finance-progress")
    .style.width = `${progress}%`;

  document.getElementById("finance-remaining")
    .textContent = budget > 0
      ? total > budget
        ? `Melebihi anggaran ${formatRupiah(total - budget)}`
        : `Sisa ${formatRupiah(budget - total)}`
      : "Atur anggaranmu";
}



/* =====================================
   TASK MANAGER
===================================== */

let activeTaskFilter = "all";
let taskSearchQuery = "";

function getTasks() {
  const stored = readStorage(STORAGE.tasks, []);
  return Array.isArray(stored) ? stored : [];
}

function saveTasks(tasks) {
  const saved = writeStorage(STORAGE.tasks, tasks);
  if (!saved) {
    showAlert("Tugas belum bisa disimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
  updateTaskSummary();
  return true;
}

function taskPriorityLabel(priority) {
  return ({
    high: "Tinggi",
    medium: "Sedang",
    low: "Rendah"
  })[priority] || "Sedang";
}

function taskSortValue(task) {
  const date = parseLocalDate(task.dueDate);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function renderTasks() {
  const list = document.getElementById("task-list");
  if (!list) return;

  const tasks = getTasks();
  const pending = tasks.filter(task => !task.completed);
  const completed = tasks.filter(task => task.completed);

  document.getElementById("tasks-progress-count").textContent =
    `${completed.length}/${tasks.length}`;
  document.getElementById("tasks-open-count").textContent = pending.length;
  document.getElementById("tasks-done-count").textContent = completed.length;
  document.getElementById("filter-all-count").textContent = tasks.length;
  document.getElementById("filter-pending-count").textContent = pending.length;
  document.getElementById("filter-completed-count").textContent = completed.length;

  const percent = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
  document.getElementById("tasks-progress-fill").style.width = `${percent}%`;
  document.getElementById("tasks-progress-caption").textContent =
    tasks.length ? `${percent}% tugas sudah diselesaikan` : "Mulai tambahkan tugas pertamamu";

  const titles = { all: "Semua tugas", pending: "Tugas aktif", completed: "Tugas selesai" };
  document.getElementById("task-list-title").textContent = titles[activeTaskFilter];
  const filterButtons = document.querySelectorAll("[data-task-filter]");
  filterButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.taskFilter === activeTaskFilter);
    button.setAttribute("aria-pressed", button.dataset.taskFilter === activeTaskFilter ? "true" : "false");
  });

  let visible = tasks.filter(task => {
    if (activeTaskFilter === "pending" && task.completed) return false;
    if (activeTaskFilter === "completed" && !task.completed) return false;
    const query = taskSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${task.title || ""} ${task.subject || ""}`.toLowerCase().includes(query);
  });

  visible.sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    return taskSortValue(a) - taskSortValue(b);
  });

  document.getElementById("task-list-total").textContent =
    `${visible.length} ${visible.length === 1 ? "tugas" : "tugas"}`;

  if (!visible.length) {
    const hasTasks = tasks.length > 0;
    const hasQuery = taskSearchQuery.trim().length > 0;
    list.innerHTML = `
      <div class="task-empty-state">
        <div class="task-empty-icon">
          <svg viewBox="0 0 24 24"><path d="M8 4h12v16H4V4h4Z"/><path d="M8 2v4M16 2v4M4 9h16"/></svg>
        </div>
        <strong>${hasQuery ? "Tidak ditemukan" : hasTasks ? "Belum ada di sini" : "Belum ada tugas"}</strong>
        <p>${hasQuery ? "Coba kata kunci lain." : hasTasks ? "Tugas dengan filter ini akan muncul di sini." : "Tambahkan tugas sekolah agar semuanya tercatat rapi."}</p>
        ${!hasTasks && !hasQuery ? '<button type="button" class="empty-add-task" data-task-action="add">Tambah tugas pertama</button>' : ""}
      </div>`;
    return;
  }

  list.innerHTML = visible.map(task => {
    const id = escapeHTML(task.id);
    const title = escapeHTML(task.title || "Tanpa judul");
    const subject = escapeHTML(task.subject || "Umum");
    const deadline = task.dueDate ? formatDeadline(task.dueDate) : "Tanpa tenggat";
    const priority = taskPriorityLabel(task.priority);
    const dueClass = deadline === "Terlambat" ? "late" :
      (deadline === "Hari ini" || deadline === "Besok") ? "soon" : "";
    return `
      <article class="task-card ${task.completed ? "is-completed" : ""}" data-task-id="${id}">
        <button type="button" class="task-check ${task.completed ? "checked" : ""}" data-task-action="toggle" data-id="${id}" aria-label="${task.completed ? "Tandai belum selesai" : "Tandai selesai"}" aria-pressed="${task.completed ? "true" : "false"}">
          ${task.completed ? '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>' : ""}
        </button>
        <div class="task-card-content">
          <div class="task-card-topline">
            <span class="task-subject">${subject}</span>
            <span class="task-priority ${escapeHTML(task.priority || "medium")}">${priority}</span>
          </div>
          <strong class="task-card-title">${title}</strong>
          <div class="task-card-meta ${dueClass}">
            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
            <span>${escapeHTML(deadline)}</span>
          </div>
        </div>
        <div class="task-card-actions">
          <button type="button" data-task-action="edit" data-id="${id}" aria-label="Edit tugas">
            <svg viewBox="0 0 24 24"><path d="m14 6 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></svg>
          </button>
          <button type="button" data-task-action="delete" data-id="${id}" aria-label="Hapus tugas">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>
          </button>
        </div>
      </article>`;
  }).join("");
}

function openTaskModal(task = null) {
  const modal = document.getElementById("task-modal");
  const form = document.getElementById("task-form");
  form.reset();

  document.getElementById("task-edit-id").value = task ? task.id : "";
  document.getElementById("task-form-title").textContent = task ? "Edit tugas" : "Tugas baru";
  document.getElementById("task-title-input").value = task ? task.title || "" : "";
  document.getElementById("task-subject-input").value = task ? task.subject || "Umum" : "Umum";
  document.getElementById("task-date-input").value = task ? task.dueDate || "" : "";
  refreshDateTrigger("task-date-input");

  const priority = task ? task.priority || "medium" : "medium";
  const radio = document.querySelector(`input[name="task-priority"][value="${priority}"]`);
  if (radio) radio.checked = true;

  document.getElementById("save-task-button").textContent = task ? "Simpan perubahan" : "Simpan tugas";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("task-title-input").focus(), 100);
}

function closeTaskModal() {
  const modal = document.getElementById("task-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const title = document.getElementById("task-title-input").value.trim();
  const subject = document.getElementById("task-subject-input").value.trim() || "Umum";
  const dueDate = document.getElementById("task-date-input").value;
  const editId = document.getElementById("task-edit-id").value;
  const priority = document.querySelector('input[name="task-priority"]:checked')?.value || "medium";

  if (!title) {
    document.getElementById("task-title-input").focus();
    return;
  }

  const tasks = getTasks();
  if (editId) {
    const index = tasks.findIndex(task => String(task.id) === String(editId));
    if (index !== -1) {
      tasks[index] = { ...tasks[index], title, subject, dueDate, priority };
    }
  } else {
    tasks.push({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title, subject, dueDate, priority,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  if (saveTasks(tasks)) {
    closeTaskModal();
    activeTaskFilter = "all";
    taskSearchQuery = "";
    document.getElementById("task-search-input").value = "";
    renderTasks();
  }
}

function initializeTaskManager() {
  const list = document.getElementById("task-list");
  if (!list || list.dataset.initialized === "true") return;
  list.dataset.initialized = "true";

  document.getElementById("open-task-form").addEventListener("click", () => openTaskModal());
  document.getElementById("close-task-form").addEventListener("click", closeTaskModal);
  document.getElementById("cancel-task-form").addEventListener("click", closeTaskModal);
  document.getElementById("task-form").addEventListener("submit", handleTaskSubmit);

  document.getElementById("task-modal").addEventListener("click", event => {
    if (event.target.id === "task-modal") closeTaskModal();
  });

  document.getElementById("task-search-input").addEventListener("input", event => {
    taskSearchQuery = event.target.value;
    renderTasks();
  });

  document.querySelectorAll("[data-task-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeTaskFilter = button.dataset.taskFilter;
      renderTasks();
    });
  });

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-task-action]");
    if (!button) return;
    const action = button.dataset.taskAction;
    const id = button.dataset.id;
    const tasks = getTasks();
    const task = tasks.find(item => String(item.id) === String(id));

    if (action === "add") {
      openTaskModal();
    } else if (!task) {
      return;
    } else if (action === "toggle") {
      task.completed = !task.completed;
      saveTasks(tasks);
    } else if (action === "edit") {
      openTaskModal(task);
    } else if (action === "delete") {
      confirmDelete("tugas", task.title).then(ok => {
        if (ok) saveTasks(getTasks().filter(item => String(item.id) !== String(id)));
      });
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeTaskModal();
  });

  renderTasks();
}



/* =====================================
   FOCUS TIMER
===================================== */

const FOCUS_PRESETS = { work: 25, break: 5 };
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 116;
let focusMode = "work";
let focusDuration = 25 * 60;
let focusRemaining = focusDuration;
let focusRunning = false;
let focusEndsAt = null;
let focusTick = null;

/* =====================================
   NOTIFIER (notifikasi APK + browser)
===================================== */

const NOTIF_ID = { ongoing: 1002, planBase: 1100 }; // sesi: 1100, 1101, 1102, ...
const AUTO_PHASES = 8;               // jumlah fase yang dijadwalkan sekaligus (fokus+istirahat)
const FOCUS_AUTO_CONTINUE = true;    // false = berhenti tiap sesi selesai (cara lama)
const NOTIF_CHANNEL = "pomodoro";
const NOTIF_CHANNEL_ONGOING = "pomodoro-berjalan";
const NOTIF_SMALL_ICON = "ic_stat_pomodoro";

const Notifier = {
  token: 0,
  planEnd: 0,
  channelReady: false,

  // true kalau app berjalan sebagai APK Capacitor
  isNative() {
    try {
      return Boolean(
        window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === "function" &&
        window.Capacitor.isNativePlatform()
      );
    } catch (error) {
      return false;
    }
  },

  // ambil plugin LocalNotifications (null kalau di browser / plugin tidak ada)
  plugin() {
    try {
      if (!this.isNative()) return null;
      const plugins = window.Capacitor.Plugins || {};
      return plugins.LocalNotifications || null;
    } catch (error) {
      return null;
    }
  },

  formatClock(timestamp) {
    const date = new Date(timestamp);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  },

  getTexts(mode) {
    return mode === "work"
      ? { title: "Sesi fokus selesai", body: "Waktunya istirahat." }
      : { title: "Istirahat selesai", body: "Saatnya fokus lagi." };
  },

  // Cek izin, lalu minta kalau perlu. ask=false => hanya cek, tanpa dialog.
  async ensurePermission(ask = true) {
    const plugin = this.plugin();

    if (plugin) {
      try {
        let status = await plugin.checkPermissions();
        if (status.display === "granted") return true;
        if (!ask || status.display === "denied") return false;
        status = await plugin.requestPermissions();
        return status.display === "granted";
      } catch (error) {
        console.warn("Gagal cek/minta izin notifikasi:", error);
        return false;
      }
    }

    // Fallback browser
    try {
      if (!("Notification" in window)) return false;
      if (Notification.permission === "granted") return true;
      if (!ask || Notification.permission === "denied") return false;
      const result = await Notification.requestPermission();
      return result === "granted";
    } catch (error) {
      console.warn("Gagal minta izin notifikasi web:", error);
      return false;
    }
  },

  // Buat 2 channel Android: "pomodoro" (bunyi + muncul di atas layar)
  // dan "pomodoro-berjalan" (senyap, khusus notifikasi menetap)
  async createChannel() {
    const plugin = this.plugin();
    if (!plugin || this.channelReady) return false;
    try {
      await plugin.createChannel({
        id: NOTIF_CHANNEL,
        name: "Pomodoro",
        description: "Pemberitahuan saat sesi fokus atau istirahat selesai",
        importance: 4,
        visibility: 1,
        vibration: true,
        lights: true
      });
      await plugin.createChannel({
        id: NOTIF_CHANNEL_ONGOING,
        name: "Timer berjalan",
        description: "Menampilkan timer yang sedang berjalan",
        importance: 2,
        visibility: 1,
        vibration: false
      });
      this.channelReady = true;
      return true;
    } catch (error) {
      console.warn("Gagal membuat channel notifikasi:", error);
      return false;
    }
  },

  // Jadwalkan notifikasi akhir tiap fase, berantai: fokus -> istirahat -> fokus ...
  // Jadi tetap berbunyi walau app ditutup dan timer lanjut sendiri.
  async scheduleSession(mode, endsAt) {
    const plugin = this.plugin();
    if (!plugin) return false;
    if (!(Number(endsAt) > Date.now())) return false;

    const items = [];
    let phaseMode = mode;
    let at = Number(endsAt);
    for (let i = 0; i < AUTO_PHASES; i++) {
      const texts = this.getTexts(phaseMode);
      items.push({
        id: NOTIF_ID.planBase + i,
        title: texts.title,
        body: texts.body,
        channelId: NOTIF_CHANNEL,
        smallIcon: NOTIF_SMALL_ICON,
        schedule: { at: new Date(at), allowWhileIdle: true }
      });
      phaseMode = phaseMode === "work" ? "break" : "work";
      at += FOCUS_PRESETS[phaseMode] * 60000;
    }

    try {
      await this.cancelPlan();
      await plugin.schedule({ notifications: items });
      this.planEnd = items[items.length - 1].schedule.at.getTime();
      return true;
    } catch (error) {
      console.warn("Gagal menjadwalkan notifikasi:", error);
      return false;
    }
  },

  // Batalkan hanya jadwal yang belum berbunyi (notifikasi yang sudah muncul dibiarkan)
  async cancelPlan() {
    const plugin = this.plugin();
    if (!plugin) return false;
    try {
      const pending = await plugin.getPending();
      const ids = (pending.notifications || [])
        .map(item => item.id)
        .filter(id => id >= NOTIF_ID.planBase && id < NOTIF_ID.planBase + AUTO_PHASES);
      if (ids.length) {
        await plugin.cancel({ notifications: ids.map(id => ({ id })) });
      }
      return true;
    } catch (error) {
      console.warn("Gagal membatalkan jadwal lama:", error);
      return false;
    }
  },

  // Notifikasi menetap: "Fokus sampai 14:25"
  async showOngoing(mode, endsAt) {
    const plugin = this.plugin();
    if (!plugin) return false;
    if (!(Number(endsAt) > Date.now())) return false;

    const label = mode === "work" ? "Fokus" : "Istirahat";
    try {
      await plugin.schedule({
        notifications: [{
          id: NOTIF_ID.ongoing,
          title: "School Hub",
          body: `${label} sampai ${this.formatClock(endsAt)}`,
          channelId: NOTIF_CHANNEL_ONGOING,
          smallIcon: NOTIF_SMALL_ICON,
          ongoing: true,
          autoCancel: false
        }]
      });
      return true;
    } catch (error) {
      console.warn("Gagal menampilkan notifikasi menetap:", error);
      return false;
    }
  },

  // Hapus hanya notifikasi menetap
  async removeOngoing() {
    const plugin = this.plugin();
    if (!plugin) return false;
    try {
      await plugin.cancel({ notifications: [{ id: NOTIF_ID.ongoing }] });
      return true;
    } catch (error) {
      console.warn("Gagal menghapus notifikasi menetap:", error);
      return false;
    }
  },

  // Batalkan jadwal + notifikasi menetap
  async cancelAll() {
    this.token += 1; // membatalkan proses sinkronisasi yang masih menunggu
    const plugin = this.plugin();
    if (!plugin) return false;
    try {
      const ids = [{ id: NOTIF_ID.ongoing }];
      for (let i = 0; i < AUTO_PHASES; i++) ids.push({ id: NOTIF_ID.planBase + i });
      await plugin.cancel({ notifications: ids });
      return true;
    } catch (error) {
      console.warn("Gagal membatalkan notifikasi:", error);
      return false;
    }
  },

  // Notifikasi web (hanya di browser; di APK sudah ditangani native)
  showWeb(mode) {
    if (this.isNative()) return false;
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return false;
      const texts = this.getTexts(mode);
      new Notification(texts.title, { body: texts.body });
      return true;
    } catch (error) {
      console.warn("Gagal menampilkan notifikasi web:", error);
      return false;
    }
  }
};

// Urutan: izin -> channel -> jadwal -> notifikasi menetap.
// Dicek lagi setelah tiap langkah, supaya kalau pengguna keburu Jeda/Reset
// jadwal lama tidak muncul.
async function syncFocusNotifications(ask = true) {
  if (!focusRunning || !focusEndsAt) return;

  const endsAt = focusEndsAt;
  const mode = focusMode;
  const token = ++Notifier.token;
  const stillValid = () =>
    focusRunning && focusEndsAt === endsAt && Notifier.token === token;

  const allowed = await Notifier.ensurePermission(ask);
  if (!allowed || !stillValid()) return;

  await Notifier.createChannel();
  if (!stillValid()) return;

  await Notifier.scheduleSession(mode, endsAt);
  if (!stillValid()) return;

  await Notifier.showOngoing(mode, endsAt);
  if (!focusRunning) Notifier.cancelAll();
}

function startFocusTick() {
  if (focusTick) clearInterval(focusTick);
  focusTick = setInterval(tickFocusTimer, 250);
}

// Dipanggil saat waktu fase habis. Kalau app sempat tertidur beberapa fase,
// semua fase yang terlewat dihitung (maksimal AUTO_PHASES), lalu timer lanjut.
function catchUpFocusSession() {
  let phases = 0;
  let late = false;

  while (focusRunning && focusEndsAt && Date.now() >= focusEndsAt && phases < AUTO_PHASES) {
    const silent = Date.now() - focusEndsAt > 5000;
    late = late || silent;
    phases += 1;
    finishFocusSession(silent);
  }

  // Terlalu lama ditinggal: berhenti saja, jangan menghitung waktu yang tidak ada
  if (focusRunning && focusEndsAt && Date.now() >= focusEndsAt) {
    focusRunning = false;
    focusEndsAt = null;
    focusRemaining = focusDuration;
    if (focusTick) clearInterval(focusTick);
    Notifier.cancelAll();
    saveFocusSession();
    renderFocusTimer();
    return;
  }

  if (late && focusRunning) syncFocusNotifications(false);
}

function getFocusSession() {
  const saved = readStorage(STORAGE.focusSession, null);
  if (!saved || typeof saved !== "object") return null;
  return saved;
}

function saveFocusSession() {
  writeStorage(STORAGE.focusSession, {
    mode: focusMode,
    duration: focusDuration,
    remaining: focusRemaining,
    running: focusRunning,
    endsAt: focusEndsAt
  });
}

function restoreFocusSession() {
  const saved = getFocusSession();
  if (!saved) return;
  if (saved.mode !== "work" && saved.mode !== "break") return;
  focusMode = saved.mode;
  focusDuration = Math.max(60, Number(saved.duration) || 1500);
  focusRunning = Boolean(saved.running);
  focusEndsAt = saved.endsAt ? Number(saved.endsAt) : null;
  focusRemaining = Math.max(0, Number(saved.remaining) || focusDuration);

  if (focusRunning && focusEndsAt) {
    focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
    if (focusRemaining <= 0) catchUpFocusSession();
    else startFocusTick();
  } else {
    focusRunning = false;
    focusEndsAt = null;
  }

  if (focusRunning && focusEndsAt) syncFocusNotifications(false);
}

function renderFocusTimer() {
  const display = document.getElementById("timer-display");
  if (!display) return;

  const minutes = Math.floor(focusRemaining / 60);
  const seconds = focusRemaining % 60;
  display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = focusDuration > 0 ? (focusDuration - focusRemaining) / focusDuration : 0;
  const circle = document.getElementById("timer-progress");
  circle.style.strokeDasharray = TIMER_CIRCUMFERENCE;
  circle.style.strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progress);

  const isWork = focusMode === "work";
  document.getElementById("timer-caption").textContent = isWork ? "WAKTU FOKUS" : "WAKTU ISTIRAHAT";
  document.getElementById("timer-state").textContent = focusRunning
    ? "Sedang berjalan"
    : focusRemaining === 0 ? "Sesi selesai" : "Siap untuk mulai";
  document.getElementById("timer-toggle-label").textContent = focusRunning
    ? "Jeda" : focusRemaining === 0 ? "Mulai lagi" : isWork ? "Mulai fokus" : "Mulai istirahat";
  document.getElementById("timer-play-icon").innerHTML = focusRunning
    ? '<path d="M7 5h4v14H7zM14 5h4v14h-4z"/>'
    : '<path d="m8 5 12 7-12 7V5Z"/>';

  document.querySelectorAll("[data-focus-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.focusMode === focusMode);
  });

  document.querySelectorAll("[data-work-minutes]").forEach(button => {
    const selected = Number(button.dataset.workMinutes) * 60 ===
      (focusMode === "work" ? focusDuration : FOCUS_PRESETS.work * 60);
    button.classList.toggle("active", selected);
  });

  updateFocusTodayCard();
}

function updateFocusTodayCard() {
  const focus = readStorage(STORAGE.focus, {});
  const minutes = focus.date === dateKey() ? Math.max(0, Number(focus.minutes) || 0) : 0;
  const target = Math.max(1, Number(focus.targetMinutes) || 120);
  const percent = Math.min(100, Math.round(minutes / target * 100));

  document.getElementById("focus-today-minutes").textContent = minutes;
  document.getElementById("focus-today-bar").style.width = `${percent}%`;
  document.getElementById("focus-today-caption").textContent =
    minutes ? `${percent}% dari target harian` : "Mulai sesi pertamamu";
  document.getElementById("focus-today-goal").textContent = `Target ${target} menit`;
}

function startFocusTimer() {
  if (focusRemaining <= 0) focusRemaining = focusDuration;
  focusRunning = true;
  focusEndsAt = Date.now() + focusRemaining * 1000;
  saveFocusSession();
  renderFocusTimer();
  if (focusTick) clearInterval(focusTick);
  focusTick = setInterval(tickFocusTimer, 250);
  syncFocusNotifications(true);
}

function pauseFocusTimer() {
  if (focusEndsAt) focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
  focusRunning = false;
  focusEndsAt = null;
  if (focusTick) clearInterval(focusTick);
  Notifier.cancelAll();
  saveFocusSession();
  renderFocusTimer();
}

function resetFocusTimer() {
  focusRunning = false;
  focusEndsAt = null;
  focusRemaining = focusDuration;
  if (focusTick) clearInterval(focusTick);
  Notifier.cancelAll();
  saveFocusSession();
  renderFocusTimer();
}

function tickFocusTimer() {
  if (!focusRunning || !focusEndsAt) return;
  focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
  if (focusRemaining <= 0) {
    catchUpFocusSession();
  } else {
    renderFocusTimer();
  }
}

function finishFocusSession(silent = false) {
  const endedAt = focusEndsAt || Date.now();
  const completedMode = focusMode;
  const completedMinutes = Math.round(focusDuration / 60);

  focusRunning = false;
  focusEndsAt = null;
  focusRemaining = 0;

  if (completedMode === "work") {
    const previous = readStorage(STORAGE.focus, {});
    const today = dateKey();
    const minutes = previous.date === today ? Math.max(0, Number(previous.minutes) || 0) : 0;
    const targetMinutes = Math.max(1, Number(previous.targetMinutes) || 120);
    writeStorage(STORAGE.focus, {
      date: today,
      minutes: minutes + completedMinutes,
      targetMinutes
    });
    updateFocusSummary();
    focusMode = "break";
    focusDuration = FOCUS_PRESETS.break * 60;
  } else {
    focusMode = "work";
    focusDuration = FOCUS_PRESETS.work * 60;
  }

  focusRemaining = focusDuration;

  // Lanjut otomatis ke fase berikutnya, tanpa menekan Mulai lagi
  if (FOCUS_AUTO_CONTINUE) {
    focusRunning = true;
    focusEndsAt = endedAt + focusDuration * 1000;
    focusRemaining = Math.max(0, Math.ceil((focusEndsAt - Date.now()) / 1000));
    startFocusTick();
  } else if (focusTick) {
    clearInterval(focusTick);
  }

  saveFocusSession();
  renderFocusTimer();

  if (silent) return;

  Notifier.showWeb(completedMode);
  if (focusRunning) {
    Notifier.showOngoing(focusMode, focusEndsAt);
    // jadwal hampir habis -> perbarui (ditunda supaya notifikasi barusan sempat berbunyi)
    if (Notifier.plugin() && Notifier.planEnd - Date.now() < FOCUS_PRESETS.work * 120000) {
      setTimeout(() => syncFocusNotifications(false), 5000);
    }
  } else {
    Notifier.removeOngoing();
  }
}

function setFocusMode(mode) {
  if (mode !== "work" && mode !== "break") return;
  if (focusRunning) pauseFocusTimer();
  Notifier.cancelAll();
  focusMode = mode;
  focusDuration = FOCUS_PRESETS[mode] * 60;
  focusRemaining = focusDuration;
  saveFocusSession();
  renderFocusTimer();
}

function initializeFocusTimer() {
  const display = document.getElementById("timer-display");
  if (!display || display.dataset.initialized === "true") return;
  display.dataset.initialized = "true";

  restoreFocusSession();
  renderFocusTimer();

  document.getElementById("timer-toggle").addEventListener("click", () => {
    if (focusRunning) pauseFocusTimer();
    else startFocusTimer();
  });

  document.getElementById("timer-reset").addEventListener("click", resetFocusTimer);

  document.getElementById("timer-skip").addEventListener("click", () => {
    if (focusMode === "work") {
      if (focusRunning) pauseFocusTimer();
      setFocusMode("break");
    } else {
      if (focusRunning) pauseFocusTimer();
      setFocusMode("work");
    }
  });

  document.querySelectorAll("[data-focus-mode]").forEach(button => {
    button.addEventListener("click", () => setFocusMode(button.dataset.focusMode));
  });

  document.querySelectorAll("[data-work-minutes]").forEach(button => {
    button.addEventListener("click", () => {
      if (focusRunning) pauseFocusTimer();
      FOCUS_PRESETS.work = Number(button.dataset.workMinutes);
      FOCUS_PRESETS.break = Number(button.dataset.breakMinutes);
      focusMode = "work";
      focusDuration = FOCUS_PRESETS.work * 60;
      focusRemaining = focusDuration;
      saveFocusSession();
      renderFocusTimer();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && focusRunning) tickFocusTimer();
  });
}


/* =====================================
   NOTES
===================================== */

let activeNoteFilter = "all";
let noteSearchQuery = "";

function getNotes() {
  const notes = readStorage(STORAGE.notes, []);
  return Array.isArray(notes) ? notes : [];
}

function saveNotes(notes) {
  const saved = writeStorage(STORAGE.notes, notes);
  if (!saved) {
    showAlert("Catatan belum bisa disimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
  return true;
}

function noteDateLabel(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function renderNotes() {
  const grid = document.getElementById("notes-grid");
  if (!grid) return;

  const allNotes = getNotes();
  const pinnedCount = allNotes.filter(note => note.pinned).length;

  document.getElementById("notes-count-all").textContent = allNotes.length;
  document.getElementById("notes-count-pinned").textContent = pinnedCount;

  let visible = allNotes.filter(note => {
    if (activeNoteFilter === "pinned" && !note.pinned) return false;
    const query = noteSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${note.title || ""} ${note.content || ""}`.toLowerCase().includes(query);
  });

  visible.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
  });

  document.getElementById("notes-total").textContent =
    `${visible.length} ${visible.length === 1 ? "catatan" : "catatan"}`;

  document.querySelectorAll("[data-note-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.noteFilter === activeNoteFilter);
    button.setAttribute("aria-pressed", button.dataset.noteFilter === activeNoteFilter ? "true" : "false");
  });

  grid.innerHTML = visible.map(note => {
    const color = ["violet", "blue", "mint", "amber"].includes(note.color) ? note.color : "violet";
    const title = escapeHTML(note.title || "Tanpa judul");
    const content = escapeHTML(note.content || "").replace(/\n/g, "<br>");
    const date = noteDateLabel(note.updatedAt || note.createdAt);
    return `
      <article class="note-card note-${color}" data-note-card="${escapeHTML(note.id)}">
        <div class="note-card-top">
          <span class="note-card-date">${date}</span>
          <button type="button" class="note-pin ${note.pinned ? "is-pinned" : ""}" data-note-pin="${escapeHTML(note.id)}" aria-label="${note.pinned ? "Lepas sematan" : "Sematkan catatan"}">
            <svg viewBox="0 0 24 24"><path d="m16 3 5 5-4 1-4 4v5l-2 2-2-7-7-2 2-2h5l4-4 1-4Z"/></svg>
          </button>
        </div>
        <button type="button" class="note-card-content" data-note-edit="${escapeHTML(note.id)}">
          <strong>${title}</strong>
          <span>${content || '<span class="note-no-content">Belum ada isi</span>'}</span>
        </button>
        <div class="note-card-footer">
          <span class="note-card-edited">Diperbarui ${date}</span>
          <button type="button" class="note-delete" data-note-delete="${escapeHTML(note.id)}" aria-label="Hapus catatan">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>
          </button>
        </div>
      </article>`;
  }).join("");

  const empty = document.getElementById("notes-empty");
  const hasAny = allNotes.length > 0;
  const hasVisible = visible.length > 0;
  empty.classList.toggle("show", !hasVisible);
  grid.style.display = hasVisible ? "grid" : "none";

  if (!hasAny) {
    document.getElementById("notes-empty-title").textContent = "Belum ada catatan";
    document.getElementById("notes-empty-description").textContent =
      "Mulai kumpulkan ide dan materi pentingmu di sini.";
    document.getElementById("notes-empty-add").style.display = "inline-flex";
  } else {
    document.getElementById("notes-empty-title").textContent =
      noteSearchQuery ? "Catatan tidak ditemukan" : "Belum ada catatan disematkan";
    document.getElementById("notes-empty-description").textContent =
      noteSearchQuery ? "Coba kata kunci lain." : "Sematkan catatan penting agar mudah ditemukan.";
    document.getElementById("notes-empty-add").style.display = "none";
  }
}

function openNoteForm(noteId = null) {
  const modal = document.getElementById("note-modal");
  const form = document.getElementById("note-form");
  form.reset();
  document.getElementById("note-edit-id").value = "";
  document.getElementById("note-form-title").textContent = "Catatan baru";
  document.getElementById("save-note-button").textContent = "Simpan catatan";

  if (noteId) {
    const note = getNotes().find(item => String(item.id) === String(noteId));
    if (!note) return;
    document.getElementById("note-edit-id").value = note.id;
    document.getElementById("note-title-input").value = note.title || "";
    document.getElementById("note-content-input").value = note.content || "";
    const colorInput = document.querySelector(`input[name="note-color"][value="${note.color || "violet"}"]`);
    if (colorInput) colorInput.checked = true;
    document.getElementById("note-form-title").textContent = "Edit catatan";
    document.getElementById("save-note-button").textContent = "Simpan perubahan";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("note-title-input").focus(), 100);
}

function closeNoteForm() {
  const modal = document.getElementById("note-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function initializeNotes() {
  const modal = document.getElementById("note-modal");
  if (!modal || modal.dataset.initialized === "true") return;
  modal.dataset.initialized = "true";

  document.getElementById("open-note-form").addEventListener("click", () => openNoteForm());
  document.getElementById("notes-empty-add").addEventListener("click", () => openNoteForm());
  document.getElementById("close-note-form").addEventListener("click", closeNoteForm);
  document.getElementById("cancel-note-form").addEventListener("click", closeNoteForm);

  modal.addEventListener("click", event => {
    if (event.target === modal) closeNoteForm();
  });

  document.getElementById("note-form").addEventListener("submit", event => {
    event.preventDefault();
    const title = document.getElementById("note-title-input").value.trim();
    const content = document.getElementById("note-content-input").value.trim();
    if (!title || !content) return;

    const notes = getNotes();
    const editId = document.getElementById("note-edit-id").value;
    const color = document.querySelector('input[name="note-color"]:checked')?.value || "violet";
    const now = Date.now();

    if (editId) {
      const index = notes.findIndex(note => String(note.id) === String(editId));
      if (index < 0) return;
      notes[index] = { ...notes[index], title, content, color, updatedAt: now };
    } else {
      notes.push({
        id: `note-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title, content, color, pinned: false,
        createdAt: now, updatedAt: now
      });
    }

    if (saveNotes(notes)) {
      closeNoteForm();
      renderNotes();
    }
  });

  document.getElementById("notes-search").addEventListener("input", event => {
    noteSearchQuery = event.target.value || "";
    renderNotes();
  });

  document.querySelectorAll("[data-note-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeNoteFilter = button.dataset.noteFilter;
      renderNotes();
    });
  });

  document.getElementById("notes-grid").addEventListener("click", event => {
    const edit = event.target.closest("[data-note-edit]");
    const pin = event.target.closest("[data-note-pin]");
    const del = event.target.closest("[data-note-delete]");

    if (edit) {
      openNoteForm(edit.dataset.noteEdit);
      return;
    }

    if (pin) {
      const notes = getNotes();
      const note = notes.find(item => String(item.id) === String(pin.dataset.notePin));
      if (!note) return;
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
      if (saveNotes(notes)) renderNotes();
      return;
    }

    if (del) {
      const note = getNotes().find(item => String(item.id) === String(del.dataset.noteDelete));
      if (!note) return;
      const noteId = del.dataset.noteDelete;
      confirmDelete("catatan", note.title).then(ok => {
        if (!ok) return;
        const notes = getNotes().filter(item => String(item.id) !== String(noteId));
        if (saveNotes(notes)) renderNotes();
      });
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeNoteForm();
  });

  renderNotes();
}

/* =====================================
   FINANCE CENTER (PUSAT KEUANGAN)
===================================== */

const FIN_CATEGORIES = {
  expense: [
    { id: "food", label: "Makan", color: "#FF9F6B", icon: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 4.5-3 7h3v11" },
    { id: "transport", label: "Transport", color: "#6BB8FF", icon: "M4 4h16v13H4zM4 11h16M7 20v-3M17 20v-3" },
    { id: "school", label: "Sekolah", color: "#A58BFF", icon: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5ZM8 7h7" },
    { id: "fun", label: "Hiburan", color: "#FF8FC2", icon: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" },
    { id: "shop", label: "Belanja", color: "#FFD36B", icon: "M5 8h14l-1 12H6L5 8ZM9 8a3 3 0 0 1 6 0" },
    { id: "other", label: "Lainnya", color: "#9AA0B4", icon: "M5 12h.01M12 12h.01M19 12h.01" }
  ],
  income: [
    { id: "allowance", label: "Uang saku", color: "#5EE0A0", icon: "M3 7a2 2 0 0 1 2-2h13v3M3 7v10a2 2 0 0 0 2 2h14V8H5a2 2 0 0 1-2-1ZM16 13h2" },
    { id: "job", label: "Kerja", color: "#6BB8FF", icon: "M4 8h16v11H4zM9 8V5h6v3M4 13h16" },
    { id: "scholarship", label: "Beasiswa", color: "#A58BFF", icon: "m3 9 9-5 9 5-9 5-9-5ZM7 11.2V16c3.2 2.5 6.8 2.5 10 0v-4.8" },
    { id: "gift", label: "Hadiah", color: "#FF8FC2", icon: "M4 11h16v9H4zM3 8h18v3H3zM12 8v12" },
    { id: "other", label: "Lainnya", color: "#9AA0B4", icon: "M5 12h.01M12 12h.01M19 12h.01" }
  ]
};

const finState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  filter: "all"
};

function finType(tx) {
  return tx.type === "income" ? "income" : "expense";
}

function finCategory(type, id) {
  const list = FIN_CATEGORIES[type];
  return list.find(item => item.id === id) || list[list.length - 1];
}

function finIcon(path) {
  return `<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`;
}

function finShortMoney(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}jt`;
  if (value >= 1000) return `${Math.round(value / 1000)}rb`;
  return String(value);
}

function finInMonth(tx, year, month) {
  const date = parseLocalDate(tx.date);
  return Boolean(date) && date.getFullYear() === year && date.getMonth() === month;
}

function finDayLabel(key) {
  const date = parseLocalDate(key);
  if (!date) return "Tanpa tanggal";
  const today = parseLocalDate(dateKey());
  const diff = Math.round((today - date) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function getTransactions() {
  const stored = readStorage(STORAGE.transactions, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(tx =>
    tx && Number(tx.amount) > 0 && parseLocalDate(tx.date)
  );
}

function saveTransactions(list) {
  if (!writeStorage(STORAGE.transactions, list)) {
    showAlert("Transaksi belum bisa disimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
  updateFinanceSummary();
  updateMoreSummary();
  renderFinance();
  return true;
}

function getBudget() {
  return Math.max(0, Number(readStorage(STORAGE.budget, 0)) || 0);
}

function renderFinance() {
  const listEl = document.getElementById("fin-list");
  if (!listEl) return;

  const { year, month } = finState;
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();

  const all = getTransactions();
  const monthTx = all.filter(tx => finInMonth(tx, year, month));
  const sumOf = (list, type) => list
    .filter(tx => finType(tx) === type)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const income = sumOf(monthTx, "income");
  const expense = sumOf(monthTx, "expense");
  const balance = income - expense;
  const totalBalance = sumOf(all, "income") - sumOf(all, "expense");

  /* Header bulan */
  document.getElementById("fin-month-label").textContent = `${MONTHS[month]} ${year}`;
  document.getElementById("fin-next").disabled =
    year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth());

  /* Ringkasan */
  const balanceEl = document.getElementById("fin-balance");
  balanceEl.textContent = formatRupiah(balance);
  balanceEl.classList.toggle("negative", balance < 0);
  document.getElementById("fin-income").textContent = formatRupiah(income);
  document.getElementById("fin-expense").textContent = formatRupiah(expense);
  document.getElementById("fin-total-balance").textContent = formatRupiah(totalBalance);

  /* Anggaran */
  const budget = getBudget();
  const pct = budget > 0 ? Math.round(expense / budget * 100) : 0;
  const fill = document.getElementById("fin-budget-fill");
  const hint = document.getElementById("fin-budget-hint");

  document.getElementById("fin-budget-spent").textContent = formatRupiah(expense);
  document.getElementById("fin-budget-of").textContent =
    budget > 0 ? `dari ${formatRupiah(budget)}` : "dari belum diatur";
  fill.style.width = `${Math.min(100, pct)}%`;
  fill.dataset.state = pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";
  document.getElementById("fin-edit-budget").textContent = budget > 0 ? "Ubah" : "Atur";

  document.getElementById("fin-budget-caption").textContent = budget <= 0
    ? "Atur anggaran untuk memantau pengeluaranmu."
    : expense > budget
      ? `Melebihi anggaran ${formatRupiah(expense - budget)} (${pct}%)`
      : `Sisa ${formatRupiah(budget - expense)} · ${pct}% terpakai`;

  if (budget > 0 && isCurrent && expense < budget) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate() + 1;
    hint.textContent = `Batas aman ±${formatRupiah(Math.floor((budget - expense) / daysLeft))} per hari untuk ${daysLeft} hari ke depan.`;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }

  /* Tren 6 bulan */
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const value = sumOf(
      all.filter(tx => finInMonth(tx, d.getFullYear(), d.getMonth())),
      "expense"
    );
    months.push({ label: MONTHS[d.getMonth()].slice(0, 3), value, active: i === 0 });
  }
  const maxValue = Math.max(...months.map(item => item.value), 1);
  document.getElementById("fin-trend").innerHTML = months.map(item => {
    const height = item.value > 0 ? Math.max(6, Math.round(item.value / maxValue * 100)) : 0;
    return `
      <div class="fin-bar ${item.active ? "active" : ""}">
        <span class="fin-bar-value">${item.value > 0 ? finShortMoney(item.value) : ""}</span>
        <div class="fin-bar-slot"><i style="height:${height}%"></i></div>
        <small>${item.label}</small>
      </div>`;
  }).join("");

  /* Kategori */
  const byCategory = {};
  monthTx.filter(tx => finType(tx) === "expense").forEach(tx => {
    const cat = finCategory("expense", tx.category);
    byCategory[cat.id] = (byCategory[cat.id] || 0) + Number(tx.amount);
  });
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const catsEl = document.getElementById("fin-categories");

  catsEl.innerHTML = rows.length ? rows.map(([id, value]) => {
    const cat = finCategory("expense", id);
    const share = expense > 0 ? Math.round(value / expense * 100) : 0;
    return `
      <div class="fin-cat-row" style="--c:${cat.color}">
        <div class="fin-cat-icon">${finIcon(cat.icon)}</div>
        <div class="fin-cat-main">
          <div class="fin-cat-line"><strong>${cat.label}</strong><span>${formatRupiah(value)}</span></div>
          <div class="fin-cat-track"><i style="width:${share}%"></i></div>
        </div>
        <em>${share}%</em>
      </div>`;
  }).join("") : `<p class="fin-empty-line">Belum ada pengeluaran bulan ini.</p>`;

  /* Filter */
  document.getElementById("fin-count-all").textContent = monthTx.length;
  document.getElementById("fin-count-expense").textContent =
    monthTx.filter(tx => finType(tx) === "expense").length;
  document.getElementById("fin-count-income").textContent =
    monthTx.filter(tx => finType(tx) === "income").length;
  document.querySelectorAll("[data-fin-filter]").forEach(button => {
    const active = button.dataset.finFilter === finState.filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  /* Daftar transaksi */
  const visible = monthTx
    .filter(tx => finState.filter === "all" || finType(tx) === finState.filter)
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
    );

  if (!visible.length) {
    listEl.innerHTML = `
      <div class="task-empty-state">
        <div class="task-empty-icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/></svg>
        </div>
        <strong>${monthTx.length ? "Belum ada di sini" : "Belum ada transaksi"}</strong>
        <p>${monthTx.length ? "Transaksi dengan filter ini akan muncul di sini." : "Catat uang masuk dan keluar agar keuanganmu terpantau."}</p>
        ${monthTx.length ? "" : '<button type="button" class="empty-add-task" data-fin-action="add">Catat transaksi pertama</button>'}
      </div>`;
    return;
  }

  const groups = [];
  visible.forEach(tx => {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) last.items.push(tx);
    else groups.push({ date: tx.date, items: [tx] });
  });

  listEl.innerHTML = groups.map(group => {
    const dayNet = group.items.reduce(
      (sum, tx) => sum + (finType(tx) === "income" ? 1 : -1) * Number(tx.amount), 0
    );
    return `
      <div class="fin-day">
        <div class="fin-day-head">
          <span>${escapeHTML(finDayLabel(group.date))}</span>
          <span>${dayNet < 0 ? "−" : "+"}${formatRupiah(Math.abs(dayNet))}</span>
        </div>
        ${group.items.map(tx => {
          const type = finType(tx);
          const cat = finCategory(type, tx.category);
          const id = escapeHTML(tx.id);
          const title = escapeHTML(tx.note || cat.label);
          return `
            <article class="fin-tx">
              <div class="fin-tx-icon" style="--c:${cat.color}">${finIcon(cat.icon)}</div>
              <div class="fin-tx-body">
                <strong>${title}</strong>
                <span>${tx.note ? cat.label : (type === "income" ? "Pemasukan" : "Pengeluaran")}</span>
              </div>
              <div class="fin-tx-side">
                <b class="${type === "income" ? "in" : "out"}">${type === "income" ? "+" : "−"}${formatRupiah(Number(tx.amount))}</b>
                <div class="fin-tx-actions">
                  <button type="button" data-fin-action="edit" data-id="${id}" aria-label="Edit transaksi">
                    <svg viewBox="0 0 24 24"><path d="m14 6 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></svg>
                  </button>
                  <button type="button" data-fin-action="delete" data-id="${id}" aria-label="Hapus transaksi">
                    <svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>
                  </button>
                </div>
              </div>
            </article>`;
        }).join("")}
      </div>`;
  }).join("");
}

/* Ringkasan di menu Lainnya */
function updateMoreSummary() {
  const caption = document.getElementById("more-finance-caption");
  if (!caption) return;

  const now = new Date();
  const monthTx = getTransactions()
    .filter(tx => finInMonth(tx, now.getFullYear(), now.getMonth()));

  if (!monthTx.length) {
    caption.textContent = "Catat uang masuk dan keluar";
    return;
  }

  const balance = monthTx.reduce(
    (sum, tx) => sum + (finType(tx) === "income" ? 1 : -1) * Number(tx.amount), 0
  );
  caption.textContent = `Saldo bulan ini ${formatRupiah(balance)}`;
}

/* ---------- Form transaksi ---------- */

function finOpenOverlay(id) {
  const el = document.getElementById(id);
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function finCloseOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function finFormatAmountInput(input) {
  const digits = input.value.replace(/\D/g, "").slice(0, 12);
  input.value = digits ? Number(digits).toLocaleString("id-ID") : "";
}

function finParseAmount(value) {
  return Number(String(value).replace(/\D/g, "")) || 0;
}

function renderFinCategoryGrid(type, selected) {
  const list = FIN_CATEGORIES[type];
  const chosen = list.some(item => item.id === selected) ? selected : list[0].id;

  document.getElementById("fin-cat-grid").innerHTML = list.map(cat => `
    <label class="fin-cat-option" style="--c:${cat.color}">
      <input type="radio" name="fin-cat" value="${cat.id}" ${cat.id === chosen ? "checked" : ""}>
      <span><i>${finIcon(cat.icon)}</i>${cat.label}</span>
    </label>`).join("");
}

function openFinForm(tx = null) {
  document.getElementById("fin-form").reset();

  const type = tx ? finType(tx) : "expense";
  document.getElementById("fin-edit-id").value = tx ? tx.id : "";
  document.getElementById("fin-form-title").textContent = tx ? "Edit transaksi" : "Transaksi baru";
  document.getElementById("save-fin-button").textContent = tx ? "Simpan perubahan" : "Simpan";
  document.querySelector(`input[name="fin-type"][value="${type}"]`).checked = true;

  const amountInput = document.getElementById("fin-amount-input");
  amountInput.value = tx ? Number(tx.amount).toLocaleString("id-ID") : "";

  let defaultDate = dateKey();
  const viewingOther =
    finState.year !== new Date().getFullYear() || finState.month !== new Date().getMonth();
  if (!tx && viewingOther) {
    defaultDate = dateKey(new Date(finState.year, finState.month, 1));
  }
  document.getElementById("fin-date-input").value = tx ? tx.date : defaultDate;
  refreshDateTrigger("fin-date-input");
  document.getElementById("fin-note-input").value = tx ? tx.note || "" : "";

  renderFinCategoryGrid(type, tx ? tx.category : null);
  finOpenOverlay("fin-modal");
  setTimeout(() => amountInput.focus(), 120);
}

function handleFinSubmit(event) {
  event.preventDefault();

  const amount = finParseAmount(document.getElementById("fin-amount-input").value);
  const type = document.querySelector('input[name="fin-type"]:checked')?.value || "expense";
  const category = document.querySelector('input[name="fin-cat"]:checked')?.value || "other";
  const date = document.getElementById("fin-date-input").value;
  const note = document.getElementById("fin-note-input").value.trim();
  const editId = document.getElementById("fin-edit-id").value;

  if (amount <= 0) {
    document.getElementById("fin-amount-input").focus();
    return;
  }
  if (!parseLocalDate(date)) {
    document.querySelector('[data-date-for="fin-date-input"]').focus();
    return;
  }

  const list = getTransactions();
  if (editId) {
    const index = list.findIndex(tx => String(tx.id) === String(editId));
    if (index !== -1) list[index] = { ...list[index], type, amount, category, date, note };
  } else {
    list.push({
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, amount, category, date, note,
      createdAt: Date.now()
    });
  }

  const saved = parseLocalDate(date);
  finState.year = saved.getFullYear();
  finState.month = saved.getMonth();

  if (saveTransactions(list)) {
    finCloseOverlay("fin-modal");
    if (navigator.vibrate) navigator.vibrate(10);
  }
}

function openFinBudgetForm() {
  const budget = getBudget();
  const input = document.getElementById("fin-budget-input");
  input.value = budget > 0 ? budget.toLocaleString("id-ID") : "";
  finOpenOverlay("fin-budget-modal");
  setTimeout(() => input.focus(), 120);
}

function saveBudgetValue(value) {
  if (!writeStorage(STORAGE.budget, value)) {
    showAlert("Anggaran belum bisa disimpan. Periksa ruang penyimpanan browser.");
    return;
  }
  finCloseOverlay("fin-budget-modal");
  updateFinanceSummary();
  renderFinance();
}

function initializeFinance() {
  const list = document.getElementById("fin-list");
  if (!list || list.dataset.initialized === "true") return;
  list.dataset.initialized = "true";

  document.getElementById("open-fin-form").addEventListener("click", () => openFinForm());
  document.getElementById("close-fin-form").addEventListener("click", () => finCloseOverlay("fin-modal"));
  document.getElementById("cancel-fin-form").addEventListener("click", () => finCloseOverlay("fin-modal"));
  document.getElementById("fin-form").addEventListener("submit", handleFinSubmit);

  document.getElementById("fin-modal").addEventListener("click", event => {
    if (event.target.id === "fin-modal") finCloseOverlay("fin-modal");
  });

  document.querySelectorAll('input[name="fin-type"]').forEach(radio => {
    radio.addEventListener("change", () => renderFinCategoryGrid(radio.value, null));
  });

  document.getElementById("fin-amount-input")
    .addEventListener("input", event => finFormatAmountInput(event.target));
  document.getElementById("fin-budget-input")
    .addEventListener("input", event => finFormatAmountInput(event.target));

  /* Anggaran */
  document.getElementById("fin-edit-budget").addEventListener("click", openFinBudgetForm);
  document.getElementById("close-fin-budget").addEventListener("click", () => finCloseOverlay("fin-budget-modal"));
  document.getElementById("fin-budget-modal").addEventListener("click", event => {
    if (event.target.id === "fin-budget-modal") finCloseOverlay("fin-budget-modal");
  });
  document.getElementById("fin-budget-form").addEventListener("submit", event => {
    event.preventDefault();
    saveBudgetValue(finParseAmount(document.getElementById("fin-budget-input").value));
  });
  document.getElementById("clear-fin-budget").addEventListener("click", () => saveBudgetValue(0));

  /* Navigasi bulan */
  document.getElementById("fin-prev").addEventListener("click", () => {
    const d = new Date(finState.year, finState.month - 1, 1);
    finState.year = d.getFullYear();
    finState.month = d.getMonth();
    renderFinance();
  });
  document.getElementById("fin-next").addEventListener("click", () => {
    const d = new Date(finState.year, finState.month + 1, 1);
    finState.year = d.getFullYear();
    finState.month = d.getMonth();
    renderFinance();
  });

  /* Filter */
  document.querySelectorAll("[data-fin-filter]").forEach(button => {
    button.addEventListener("click", () => {
      finState.filter = button.dataset.finFilter;
      renderFinance();
    });
  });

  /* Aksi pada daftar */
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-fin-action]");
    if (!button) return;

    const action = button.dataset.finAction;
    if (action === "add") {
      openFinForm();
      return;
    }

    const items = getTransactions();
    const tx = items.find(item => String(item.id) === String(button.dataset.id));
    if (!tx) return;

    if (action === "edit") {
      openFinForm(tx);
    } else if (action === "delete") {
      const label = tx.note || finCategory(finType(tx), tx.category).label;
      confirmDelete("transaksi", label).then(ok => {
        if (ok) saveTransactions(getTransactions().filter(item => String(item.id) !== String(tx.id)));
      });
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      finCloseOverlay("fin-modal");
      finCloseOverlay("fin-budget-modal");
    }
  });

  renderFinance();
}

/* =====================================
   DIALOG KUSTOM (pengganti confirm/alert)
===================================== */

const DIALOG_ICONS = {
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  alert: '<path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/>'
};

let dialogResolver = null;

function closeDialog(result) {
  const backdrop = document.getElementById("app-dialog");
  if (!backdrop || !dialogResolver) return;

  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");

  const resolve = dialogResolver;
  dialogResolver = null;
  resolve(result);
}

function showDialog({
  title = "Konfirmasi",
  message = "",
  confirmText = "OK",
  cancelText = "Batal",
  danger = false,
  icon = "alert",
  hideCancel = false
} = {}) {
  const backdrop = document.getElementById("app-dialog");
  if (!backdrop) return Promise.resolve(window.confirm(message));

  if (dialogResolver) closeDialog(false);

  document.getElementById("dialog-title").textContent = title;
  document.getElementById("dialog-message").textContent = message;
  document.getElementById("dialog-icon").innerHTML =
    `<svg viewBox="0 0 24 24">${DIALOG_ICONS[icon] || DIALOG_ICONS.alert}</svg>`;
  document.getElementById("dialog-icon").classList.toggle("danger", danger);

  const confirmBtn = document.getElementById("dialog-confirm");
  const cancelBtn = document.getElementById("dialog-cancel");
  confirmBtn.textContent = confirmText;
  confirmBtn.classList.toggle("danger", danger);
  cancelBtn.textContent = cancelText;
  cancelBtn.hidden = hideCancel;
  document.querySelector(".dialog-actions").classList.toggle("single", hideCancel);

  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  if (navigator.vibrate) navigator.vibrate(10);

  setTimeout(() => (hideCancel ? confirmBtn : cancelBtn).focus(), 80);

  return new Promise(resolve => {
    dialogResolver = resolve;
  });
}

function confirmDelete(kind, name) {
  return showDialog({
    title: `Hapus ${kind}?`,
    message: name
      ? `"${name}" akan dihapus dan tidak bisa dikembalikan.`
      : `${kind} ini akan dihapus dan tidak bisa dikembalikan.`,
    confirmText: "Hapus",
    cancelText: "Batal",
    danger: true,
    icon: "trash"
  });
}

function showAlert(message, title = "Terjadi masalah") {
  return showDialog({
    title,
    message,
    confirmText: "Mengerti",
    hideCancel: true,
    icon: "alert"
  });
}

function initializeDialog() {
  const backdrop = document.getElementById("app-dialog");
  if (!backdrop || backdrop.dataset.initialized === "true") return;
  backdrop.dataset.initialized = "true";

  document.getElementById("dialog-confirm")
    .addEventListener("click", () => closeDialog(true));
  document.getElementById("dialog-cancel")
    .addEventListener("click", () => closeDialog(false));

  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeDialog(false);
  });

  // Escape menutup dialog lebih dulu, tanpa ikut menutup form di belakangnya
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialogResolver) {
      event.stopImmediatePropagation();
      closeDialog(false);
    }
  }, true);
}

/* =====================================
   KALENDER PEMILIH TANGGAL
===================================== */

const calState = {
  inputId: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  clearable: false
};

function formatDateButton(value) {
  const date = parseLocalDate(value);
  if (!date) return null;
  return `${DAYS[date.getDay()].slice(0, 3)}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

function refreshDateTrigger(inputId) {
  const input = document.getElementById(inputId);
  const trigger = document.querySelector(`[data-date-for="${inputId}"]`);
  if (!input || !trigger) return;

  const label = formatDateButton(input.value);
  trigger.querySelector(".date-trigger-text").textContent =
    label || trigger.dataset.placeholder || "Pilih tanggal";
  trigger.classList.toggle("has-value", Boolean(label));
}

function calMarkers() {
  // Tandai tanggal yang sudah punya tugas aktif (hanya untuk kolom tenggat tugas)
  if (calState.inputId !== "task-date-input") return new Set();
  return new Set(
    getTasks()
      .filter(task => !task.completed && parseLocalDate(task.dueDate))
      .map(task => task.dueDate)
  );
}

function renderCalendar() {
  const { year, month } = calState;
  const selected = document.getElementById(calState.inputId).value;
  const today = dateKey();
  const markers = calMarkers();

  document.getElementById("cal-title").textContent = `${MONTHS[month]} ${year}`;

  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // minggu dimulai Senin
  const total = new Date(year, month + 1, 0).getDate();

  let html = "";
  for (let i = 0; i < offset; i++) html += '<span class="cal-empty"></span>';

  for (let day = 1; day <= total; day++) {
    const key = dateKey(new Date(year, month, day));
    const classes = ["cal-day"];
    if (key === today) classes.push("is-today");
    if (key === selected) classes.push("is-selected");
    if (markers.has(key)) classes.push("has-task");
    html += `<button type="button" class="${classes.join(" ")}" data-cal-date="${key}" aria-label="${day} ${MONTHS[month]} ${year}"${key === selected ? ' aria-pressed="true"' : ""}>${day}</button>`;
  }

  document.getElementById("cal-grid").innerHTML = html;
}

function openCalendar(trigger) {
  const inputId = trigger.dataset.dateFor;
  const input = document.getElementById(inputId);
  if (!input) return;

  calState.inputId = inputId;
  calState.clearable = trigger.dataset.clearable === "true";

  const current = parseLocalDate(input.value) || new Date();
  calState.year = current.getFullYear();
  calState.month = current.getMonth();

  document.getElementById("cal-clear").hidden = !calState.clearable;

  renderCalendar();

  const backdrop = document.getElementById("cal-picker");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
}

function closeCalendar() {
  const backdrop = document.getElementById("cal-picker");
  if (!backdrop) return;
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
}

function pickCalendarDate(key) {
  const input = document.getElementById(calState.inputId);
  if (!input) return;
  input.value = key;
  refreshDateTrigger(calState.inputId);
  if (navigator.vibrate) navigator.vibrate(10);
  closeCalendar();
}

function shiftCalendarMonth(step) {
  const d = new Date(calState.year, calState.month + step, 1);
  calState.year = d.getFullYear();
  calState.month = d.getMonth();
  renderCalendar();
}

function initializeCalendar() {
  const backdrop = document.getElementById("cal-picker");
  if (!backdrop || backdrop.dataset.initialized === "true") return;
  backdrop.dataset.initialized = "true";

  document.addEventListener("click", event => {
    const trigger = event.target.closest(".date-trigger");
    if (trigger) openCalendar(trigger);
  });

  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeCalendar();
  });

  document.getElementById("cal-prev").addEventListener("click", () => shiftCalendarMonth(-1));
  document.getElementById("cal-next").addEventListener("click", () => shiftCalendarMonth(1));
  document.getElementById("cal-close").addEventListener("click", closeCalendar);

  document.getElementById("cal-clear").addEventListener("click", () => {
    pickCalendarDate("");
  });

  document.getElementById("cal-grid").addEventListener("click", event => {
    const button = event.target.closest("[data-cal-date]");
    if (button) pickCalendarDate(button.dataset.calDate);
  });

  document.getElementById("cal-quick").addEventListener("click", event => {
    const button = event.target.closest("[data-cal-add]");
    if (!button) return;
    const date = new Date();
    date.setDate(date.getDate() + Number(button.dataset.calAdd));
    pickCalendarDate(dateKey(date));
  });

  // Escape menutup kalender lebih dulu
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && backdrop.classList.contains("open")) {
      event.stopImmediatePropagation();
      closeCalendar();
    }
  }, true);

  refreshDateTrigger("task-date-input");
  refreshDateTrigger("fin-date-input");
}

/* =====================================
   UPDATE HOME
===================================== */

function updateHome() {

  updateGreeting();
  updateFocusSummary();
  updateTaskSummary();
  updateFinanceSummary();
  updateMoreSummary();

}

/* =====================================
   INITIALIZATION
===================================== */

function initializeApp() {

  updateHome();
  initializeTaskManager();
  initializeFocusTimer();
  initializeNotes();
  initializeFinance();
  initializeDialog();
  initializeCalendar();

  // Tombol aksi hanya muncul pada halaman yang sesuai.
  const taskFab = document.getElementById("open-task-form");
  const notesFab = document.getElementById("open-note-form");
  if (taskFab) taskFab.classList.toggle("visible", currentPage === "tasks");
  if (notesFab) notesFab.classList.toggle("visible", currentPage === "notes");

  const finFab = document.getElementById("open-fin-form");
  if (finFab) finFab.classList.toggle("visible", currentPage === "finance");

  // Tab awal
  document.querySelectorAll(".tab").forEach(tab => {

    const active = tab.dataset.page === "home";

    tab.classList.toggle("active", active);

    tab.setAttribute(
      "aria-current",
      active ? "page" : "false"
    );

  });

  // Perbarui sapaan saat aplikasi kembali aktif
  document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
      updateHome();
    }

  });

  // Perbarui dashboard setiap menit
  setInterval(() => {

    if (currentPage === "home") {
      updateHome();
    }

  }, 60000);

}

// Efek kaca di tepi atas muncul hanya saat konten bergulir di bawah status bar
document.addEventListener("scroll", event => {
  const el = event.target;
  if (el && el.classList && el.classList.contains("page")) {
    document.body.classList.toggle("scrolled", el.scrollTop > 6);
  }
}, true);

// Tombol Kembali Android: tutup lapisan teratas -> kembali ke Home -> keluar app
(function setupBackButton() {
  const cap = window.Capacitor;
  const appPlugin = cap && cap.Plugins && cap.Plugins.App;
  if (!appPlugin || !cap.isNativePlatform || !cap.isNativePlatform()) return;

  const click = id => () => document.getElementById(id).click();
  const layers = [
    ["cal-picker", click("cal-close")],
    ["app-dialog", () => closeDialog(false)],
    ["task-modal", click("close-task-form")],
    ["note-modal", click("close-note-form")],
    ["fin-modal", click("close-fin-form")],
    ["fin-budget-modal", click("close-fin-budget")]
  ];

  appPlugin.addListener("backButton", () => {
    for (const [id, close] of layers) {
      const el = document.getElementById(id);
      if (el && el.classList.contains("open")) return close();
    }
    if (currentPage === "finance") return navigate("more");
    if (currentPage !== "home") return navigate("home");
    appPlugin.exitApp();
  });
})();

initializeApp();
