
let tasks = [];
const taskForm = document.getElementById("taskForm");
const tasksList = document.getElementById("tasksList");
const emptyNote = document.getElementById("emptyNote");
const progressCircle = document.getElementById("progressCircle");
const progressLabel = document.getElementById("progressLabel");
const totalTasksElem = document.getElementById("totalTasks");
const completedTasksElem = document.getElementById("completedTasks");
const dueTodayCountElem = document.getElementById("dueTodayCount");
const donutChartCtx = document.getElementById("donutChart").getContext("2d");

let donutChart;


const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});



function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const stored = localStorage.getItem("tasks");
  if (stored) tasks = JSON.parse(stored);
}

function formatDate(input) {
  if (!input) return "";
  const date = new Date(input);
  return date.toLocaleDateString();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const dueToday = tasks.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date();
    const due = new Date(t.dueDate);
    return due.toDateString() === today.toDateString();
  }).length;

  totalTasksElem.textContent = total;
  completedTasksElem.textContent = completed;
  dueTodayCountElem.textContent = dueToday;


  const percent = total ? Math.round((completed / total) * 100) : 0;
  progressLabel.textContent = percent + "%";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference}`;
  progressCircle.style.strokeDashoffset = `${circumference * (1 - percent / 100)}`;
}

function renderTasks(filter = "all", searchTerm = "", sortBy = "newest") {
  tasksList.innerHTML = "";
  let filtered = [...tasks];

  
  const todayStr = new Date().toDateString();
  filtered = filtered.filter(task => {
    switch (filter) {
      case "pending": return !task.completed;
      case "completed": return task.completed;
      case "today": return task.dueDate && new Date(task.dueDate).toDateString() === todayStr;
      default: return true;
    }
  });


  if (searchTerm) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }


  filtered.sort((a, b) => {
    switch (sortBy) {
      case "due": return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      case "priority": return b.priority - a.priority;
      case "category": return a.category.localeCompare(b.category);
      default: return b.id - a.id;
    }
  });

  if (!filtered.length) {
    emptyNote.style.display = "block";
  } else {
    emptyNote.style.display = "none";
    filtered.forEach(task => {
      const taskElem = document.createElement("div");
      taskElem.className = "task-card";
      if (task.completed) taskElem.classList.add("completed");
      taskElem.innerHTML = `
        <div class="task-info">
          <strong>${task.title}</strong>
          <span>${task.category || ""}</span>
          <div class="task-desc">${task.description || ""}</div>
          <small>Due: ${formatDate(task.dueDate)}</small>
        </div>
        <div class="task-actions">
          <button class="toggle-btn">${task.completed ? "Undo" : "Done"}</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;
   
      taskElem.querySelector(".toggle-btn").addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks(currentFilter, document.getElementById("search").value, document.getElementById("sortBy").value);
        updateDonutChart();
      });
  
      taskElem.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this task?")) {
          tasks = tasks.filter(t => t.id !== task.id);
          saveTasks();
          renderTasks(currentFilter, document.getElementById("search").value, document.getElementById("sortBy").value);
          updateStats();
          updateDonutChart();
          showToast("Task deleted");
        }
      });
      tasksList.appendChild(taskElem);
    });
  }

  updateStats();
}


function updateDonutChart() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(donutChartCtx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#4CAF50", "#FFC107"],
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}


function showToast(msg, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const newTask = {
    id: Date.now(),
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: document.getElementById("dueDate").value,
    priority: parseInt(document.getElementById("priority").value),
    completed: false
  };
  if (!newTask.title) {
    alert("Title is required!");
    return;
  }
  tasks.push(newTask);
  saveTasks();
  renderTasks(currentFilter, document.getElementById("search").value, document.getElementById("sortBy").value);
  updateDonutChart();
  taskForm.reset();
  showToast("Task created!");
});

document.getElementById("clearBtn").addEventListener("click", () => taskForm.reset());


let currentFilter = "all";
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    renderTasks(currentFilter, document.getElementById("search").value, document.getElementById("sortBy").value);
  });
});


document.getElementById("search").addEventListener("input", e => {
  renderTasks(currentFilter, e.target.value, document.getElementById("sortBy").value);
});
document.getElementById("sortBy").addEventListener("change", e => {
  renderTasks(currentFilter, document.getElementById("search").value, e.target.value);
});


loadTasks();
renderTasks();
updateDonutChart();
