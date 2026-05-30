import React, { useMemo, useState } from "react";

const STORAGE_KEY = "daily-routine-24-hour-planner-v2";
const DAY_GOAL_HOURS = 24;
const categories = ["Sleep", "Work", "Study", "Family", "Prayer", "Reflection", "Personal Care"];

// Creates a unique id for each routine block.
function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultTasks = [
  {
    id: createId(),
    title: "Sleep and morning reset",
    category: "Sleep",
    hours: 8,
    status: "done",
    day: "Saturday",
    notes: "Rest, wake up, make the bed, and start the day calmly.",
  },
  {
    id: createId(),
    title: "Morning prayer and personal reflection",
    category: "Prayer",
    hours: 1,
    status: "done",
    day: "Saturday",
    notes: "Pray, read, journal, and set the intention for the day.",
  },
  {
    id: createId(),
    title: "Study block for CSE 310",
    category: "Study",
    hours: 4,
    status: "active",
    day: "Saturday",
    notes: "Work on the app, review code, and prepare the walkthrough.",
  },
  {
    id: createId(),
    title: "Work or responsibilities",
    category: "Work",
    hours: 4,
    status: "active",
    day: "Saturday",
    notes: "Handle job tasks, errands, or important responsibilities.",
  },
  {
    id: createId(),
    title: "Family time",
    category: "Family",
    hours: 3,
    status: "planned",
    day: "Saturday",
    notes: "Share a meal, call family, or spend focused time together.",
  },
  {
    id: createId(),
    title: "Meals, exercise, and personal care",
    category: "Personal Care",
    hours: 3,
    status: "planned",
    day: "Saturday",
    notes: "Eat, clean up, exercise, and take care of daily needs.",
  },
  {
    id: createId(),
    title: "Evening reflection and planning tomorrow",
    category: "Reflection",
    hours: 1,
    status: "planned",
    day: "Saturday",
    notes: "Review the day, update completed blocks, and prepare for Sunday.",
  },
];

const emptyForm = {
  title: "",
  category: categories[0],
  hours: "1",
  day: "Saturday",
  notes: "",
};

// Cleans saved routine data so older or incomplete local storage entries still work.
function normalizeTask(task, index) {
  return {
    id: task?.id || createId(),
    title: String(task?.title || `Routine block ${index + 1}`),
    category: categories.includes(task?.category) ? task.category : categories[0],
    hours: Math.max(Number(task?.hours) || 0.25, 0.25),
    status: ["planned", "active", "done"].includes(task?.status) ? task.status : "planned",
    day: String(task?.day || "Saturday"),
    notes: String(task?.notes || ""),
  };
}

// Loads saved routine blocks or falls back to the default 24-hour Saturday plan.
function loadTasks() {
  try {
    // Restore saved routine blocks first so the planner keeps its state after refresh.
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsedTasks = saved ? JSON.parse(saved) : defaultTasks;
    return Array.isArray(parsedTasks) ? parsedTasks.map(normalizeTask) : defaultTasks;
  } catch {
    return defaultTasks.map(normalizeTask);
  }
}

// Renders the planner and coordinates state, filtering, summaries, and generated views.
function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeView, setActiveView] = useState("planner");

  // Updates React state and local storage together so the UI and saved data stay in sync.
  function persist(nextTasks) {
    setTasks(nextTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  }

  // Copies form input changes into the current routine block form state.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Adds a new routine block or saves edits to an existing routine block.
  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;

    const nextTask = {
      ...form,
      id: editingId || createId(),
      title: trimmedTitle,
      hours: Math.max(Number(form.hours) || 0, 0.25),
      notes: form.notes.trim(),
      status: editingId ? tasks.find((task) => task.id === editingId)?.status || "planned" : "planned",
    };

    const nextTasks = editingId
      ? tasks.map((task) => (task.id === editingId ? nextTask : task))
      : [nextTask, ...tasks];

    persist(nextTasks);
    setForm(emptyForm);
    setEditingId(null);
  }

  // Loads an existing routine block into the form so it can be edited.
  function startEdit(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      category: task.category,
      hours: String(task.hours),
      day: task.day,
      notes: task.notes,
    });
  }

  // Leaves edit mode and restores the empty routine block form.
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  // Deletes a routine block and exits edit mode if the deleted block was being edited.
  function removeTask(taskId) {
    persist(tasks.filter((task) => task.id !== taskId));
    if (editingId === taskId) cancelEdit();
  }

  // Switches a routine block between complete and active status.
  function toggleComplete(taskId) {
    persist(
      tasks.map((task) => {
        if (task.id !== taskId) return task;
        return { ...task, status: task.status === "done" ? "active" : "done" };
      })
    );
  }

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        String(task.notes || "").toLowerCase().includes(query) ||
        task.day.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "All" || task.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchTerm, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    // Derive dashboard totals from the current routine list instead of storing duplicate state.
    const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
    const completedHours = tasks
      .filter((task) => task.status === "done")
      .reduce((sum, task) => sum + Number(task.hours), 0);
    const categoryTotals = categories.map((category) => ({
      category,
      hours: tasks
        .filter((task) => task.category === category)
        .reduce((sum, task) => sum + Number(task.hours), 0),
    }));

    return {
      totalHours,
      completedHours,
      plannedCount: tasks.filter((task) => task.status === "planned").length,
      activeCount: tasks.filter((task) => task.status === "active").length,
      doneCount: tasks.filter((task) => task.status === "done").length,
      progressPercent: Math.min(Math.round((completedHours / DAY_GOAL_HOURS) * 100), 100),
      categoryTotals,
    };
  }, [tasks]);

  const nextBlocks = tasks.filter((task) => task.status !== "done").slice(0, 3);
  const completedBlocks = tasks.filter((task) => task.status === "done");

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Saturday Daily Routine</p>
            <h1>24-Hour Routine Planner</h1>
          </div>
          <a
            className="repo-link"
            href="https://github.com/bbrain777/cse310-24-hour-routine-planner"
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">GH</span>
            GitHub
          </a>
        </header>

        <nav className="view-tabs" aria-label="Routine views">
          {[
            ["planner", "Planner"],
            ["summary", "Day Summary"],
            ["review", "Completion Review"],
          ].map(([view, label]) => (
            <button
              key={view}
              type="button"
              className={activeView === view ? "active" : ""}
              onClick={() => setActiveView(view)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="summary-grid" aria-label="Daily routine summary">
          <SummaryCard icon="HR" label="Scheduled Hours" value={summary.totalHours.toFixed(1)} />
          <SummaryCard icon="OK" label="Completed Hours" value={summary.completedHours.toFixed(1)} />
          <SummaryCard icon="%" label="Day Progress" value={`${summary.progressPercent}%`} />
          <SummaryCard icon="TO" label="Open Blocks" value={summary.plannedCount + summary.activeCount} />
        </section>

        <section className="progress-panel">
          <div>
            <p className="panel-label">Progress toward a 24 hour day</p>
            <div className="progress-track" aria-label={`${summary.progressPercent}% complete`}>
              <span style={{ width: `${summary.progressPercent}%` }} />
            </div>
          </div>
          <div className="status-counts" aria-label="Routine block status counts">
            <span>{summary.plannedCount} planned</span>
            <span>{summary.activeCount} active</span>
            <span>{summary.doneCount} done</span>
          </div>
        </section>

        {activeView === "planner" && (
          <>
            <div className="content-grid">
              <section className="task-editor" aria-label="Routine block editor">
                <h2>{editingId ? "Edit Routine Block" : "Add Routine Block"}</h2>
                <form onSubmit={handleSubmit}>
                  <label>
                    Activity
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Evening prayer"
                      required
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Category
                      <select name="category" value={form.category} onChange={handleChange}>
                        {categories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Hours
                      <input
                        name="hours"
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={form.hours}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <label>
                    Day
                    <select name="day" value={form.day} onChange={handleChange}>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                        <option key={day}>{day}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="What do you want this time to include?"
                      rows="4"
                    />
                  </label>

                  <div className="button-row">
                    <button type="submit" className="primary-button">
                      <span aria-hidden="true">{editingId ? "SV" : "AD"}</span>
                      {editingId ? "Save" : "Add"}
                    </button>
                    {editingId && (
                      <button type="button" className="ghost-button" onClick={cancelEdit} aria-label="Cancel edit">
                        <span aria-hidden="true">X</span>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="task-board" aria-label="Daily routine blocks">
                <div className="board-toolbar">
                  <div className="search-box">
                    <span aria-hidden="true">Search</span>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search routine"
                      aria-label="Search routine blocks"
                    />
                  </div>
                  <div className="filter-row">
                    <span aria-hidden="true">Filter</span>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                      <option>All</option>
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option>All</option>
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                </div>

                <div className="task-list">
                  {filteredTasks.length === 0 ? (
                    <p className="empty-state">No matching routine blocks. Adjust the filters or add a new activity.</p>
                  ) : (
                    filteredTasks.map((task) => (
                      <article key={task.id} className={`task-card ${task.status}`}>
                        <button
                          type="button"
                          className="status-button"
                          onClick={() => toggleComplete(task.id)}
                          aria-label={task.status === "done" ? "Mark task active" : "Mark task complete"}
                        >
                          {task.status === "done" ? "OK" : ""}
                        </button>
                        <div className="task-details">
                          <div className="task-heading">
                            <h3>{task.title}</h3>
                            <span>{task.hours} hr</span>
                          </div>
                          <p>{task.notes || "No notes added yet."}</p>
                          <div className="task-meta">
                            <span>{task.category}</span>
                            <span>{task.day}</span>
                            <span>{task.status}</span>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button type="button" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`}>
                            Edit
                          </button>
                          <button type="button" onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}>
                            Del
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="category-panel" aria-label="Hours by category">
              <h2>Hours by Category</h2>
              <div className="category-grid">
                {summary.categoryTotals.map((item) => (
                  <div key={item.category} className="category-item">
                    <span>{item.category}</span>
                    <strong>{item.hours.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeView === "summary" && (
          <section className="dynamic-page" aria-label="Generated day summary">
            <div>
              <p className="eyebrow">Generated from your current routine blocks</p>
              <h2>Day Summary</h2>
              <p>
                Your plan currently schedules {summary.totalHours.toFixed(1)} of 24 hours and has completed{" "}
                {summary.completedHours.toFixed(1)} hours.
              </p>
            </div>

            <div className="insight-grid">
              {summary.categoryTotals.map((item) => (
                <article key={item.category} className="insight-card">
                  <span>{item.category}</span>
                  <strong>{item.hours.toFixed(1)} hr</strong>
                  <p>{item.hours > 0 ? `${item.category} is included in this routine.` : "No time scheduled yet."}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === "review" && (
          <section className="dynamic-page" aria-label="Generated completion review">
            <div>
              <p className="eyebrow">Generated from completed and open blocks</p>
              <h2>Completion Review</h2>
              <p>
                {completedBlocks.length} blocks are complete, and {nextBlocks.length} upcoming blocks are ready for
                attention.
              </p>
            </div>

            <div className="review-columns">
              <div>
                <h3>Completed Blocks</h3>
                <div className="task-list">
                  {completedBlocks.length === 0 ? (
                    <p className="empty-state">No completed routine blocks yet.</p>
                  ) : (
                    completedBlocks.map((task) => (
                      <article key={task.id} className="mini-card">
                        <strong>{task.title}</strong>
                        <span>
                          {task.category} - {task.hours} hr
                        </span>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3>Next Blocks</h3>
                <div className="task-list">
                  {nextBlocks.length === 0 ? (
                    <p className="empty-state">Every routine block is complete.</p>
                  ) : (
                    nextBlocks.map((task) => (
                      <article key={task.id} className="mini-card">
                        <strong>{task.title}</strong>
                        <span>
                          {task.category} - {task.status}
                        </span>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

// Displays one dashboard metric in the summary row.
function SummaryCard({ icon, label, value }) {
  return (
    <article className="summary-card">
      <div className="summary-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export default App;
