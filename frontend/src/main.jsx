import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Folder,
  KanbanSquare,
  Layers,
  ListChecks,
  LogOut,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api, clearToken, getToken, setToken } from "./api";
import "./styles.css";

const statuses = ["TO_DO", "IN_PROGRESS", "DONE"];
const statusLabels = { TO_DO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const statusColors = { TO_DO: "purple", IN_PROGRESS: "blue", DONE: "green" };
const priorityTone = { HIGH: "red", MEDIUM: "amber", LOW: "green" };
const priorities = ["LOW", "MEDIUM", "HIGH"];
const palette = ["purple", "blue", "green", "amber", "red"];

function App() {
  const [token, saveToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [view, setView] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [modalError, setModalError] = useState("");
  const [modal, setModal] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [memberForm, setMemberForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    assigneeIds: [],
  });

  const selectedProject = projects.find((project) => String(project.id) === String(selectedProjectId));
  const isAdmin = selectedProject?.role === "ADMIN";
  const doneCount = dashboard?.tasksByStatus?.DONE ?? 0;
  const totalTasks = dashboard?.totalTasks ?? 0;
  const progress = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;

  async function loadApp(keepProjectId = selectedProjectId) {
    const [me, projectList, stats] = await Promise.all([api("/auth/me"), api("/projects"), api("/dashboard")]);
    setUser(me);
    setProjects(projectList);
    setDashboard(stats);
    const nextProjectId = keepProjectId || projectList[0]?.id || "";
    setSelectedProjectId(nextProjectId);
    await loadProjectData(nextProjectId);
  }

  async function loadProjectData(projectId = selectedProjectId) {
    if (!projectId) {
      setMembers([]);
      setTasks([]);
      return;
    }
    const [memberList, taskList] = await Promise.all([
      api(`/projects/${projectId}/members`),
      api(`/tasks?projectId=${projectId}`),
    ]);
    setMembers(memberList);
    setTasks(taskList);
  }

  useEffect(() => {
    if (!token) return;
    loadApp().catch((error) => {
      setMessage(error.message);
      clearToken();
      saveToken(null);
    });
  }, [token]);

  useEffect(() => {
    if (selectedProjectId && token) loadProjectData(selectedProjectId).catch((error) => setMessage(error.message));
  }, [selectedProjectId]);

  useEffect(() => {
    if (!message || messageType !== "success") return undefined;
    const timer = window.setTimeout(() => setMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [message, messageType]);

  async function submitAuth(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("error");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/signup";
      const payload = authMode === "login" ? { email: authForm.email, password: authForm.password } : authForm;
      const response = await api(path, { method: "POST", body: JSON.stringify(payload) });
      setToken(response.token);
      saveToken(response.token);
      setUser(response.user);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createProject(event) {
    event.preventDefault();
    const project = await api("/projects", { method: "POST", body: JSON.stringify(projectForm) });
    setProjectForm({ name: "", description: "" });
    setModal(null);
    await loadApp(project.id);
  }

  async function addMember(event) {
    event.preventDefault();
    setModalError("");
    setMessage("");
    try {
      try {
        await api(`/projects/${selectedProjectId}/members`, { method: "POST", body: JSON.stringify(memberForm) });
      } catch (error) {
        if (!error.message.toLowerCase().includes("user not found")) {
          throw error;
        }
        await api("/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            name: memberForm.name,
            email: memberForm.email,
            password: memberForm.password || "password123",
          }),
        });
        await api(`/projects/${selectedProjectId}/members`, { method: "POST", body: JSON.stringify(memberForm) });
      }
      setMemberForm({ name: "", email: "", password: "", role: "MEMBER" });
      setModal(null);
      setMessage("Member added successfully.");
      setMessageType("success");
      await loadProjectData();
      await loadApp(selectedProjectId);
      setView("team");
    } catch (error) {
      setModalError(error.message);
    }
  }

  async function removeMember(userId) {
    await api(`/projects/${selectedProjectId}/members/${userId}`, { method: "DELETE" });
    await loadProjectData();
  }

  async function createTask(event) {
    event.preventDefault();
    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...taskForm,
        projectId: Number(selectedProjectId),
        assigneeIds: taskForm.assigneeIds.map(Number),
        status: "TO_DO",
      }),
    });
    setTaskForm({ title: "", description: "", dueDate: "", priority: "MEDIUM", assigneeIds: [] });
    setModal(null);
    await loadApp(selectedProjectId);
  }

  async function updateTaskStatus(taskId, status) {
    await api(`/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadApp(selectedProjectId);
  }

  async function updateTaskAssignee(task, assigneeIds) {
    const nextAssigneeIds = assigneeIds.map(Number);
    try {
      await api(`/tasks/${task.id}/assignee`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeIds: nextAssigneeIds }),
      });
    } catch (error) {
      await api(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          assigneeIds: nextAssigneeIds,
        }),
      });
    }
    await loadApp(selectedProjectId);
  }

  async function deleteTask(taskId) {
    await api(`/tasks/${taskId}`, { method: "DELETE" });
    setMessage("Task deleted successfully.");
    setMessageType("success");
    await loadApp(selectedProjectId);
  }

  function logout() {
    clearToken();
    saveToken(null);
    setUser(null);
  }

  const tasksByStatus = useMemo(
    () => statuses.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) })),
    [tasks]
  );
  const selectedProjectTaskCounts = useMemo(() => {
    return tasks.reduce((counts, task) => {
      taskAssigneeIds(task).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
      return counts;
    }, {});
  }, [tasks]);

  if (!token) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-copy">
            <div className="logo-mark"><Layers size={20} /></div>
            <p className="eyebrow">Taskflow</p>
            <h1>Team task manager for focused project work.</h1>
            <p>Sign in, create projects, invite teammates, and move tasks through a clean kanban workflow.</p>
          </div>
          <form onSubmit={submitAuth} className="auth-form">
            <div className="segmented">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Signup</button>
            </div>
            {authMode === "signup" && <Field label="Name"><input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required /></Field>}
            <Field label="Email"><input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required /></Field>
            <Field label="Password"><input type="password" minLength="6" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required /></Field>
            {message && <p className="error">{message}</p>}
            <button className="btn btn-primary" type="submit">{authMode === "login" ? "Login" : "Create Account"}</button>
            <p className="auth-note">To test another member, logout first, signup with a new email, then login again with the admin account to add that member by email.</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"><Layers size={18} /></div>
          <div className="logo-name">Task<span>flow</span></div>
        </div>

        <nav className="nav">
          <div className="nav-section">
            <div className="nav-label">Workspace</div>
            <NavItem active={view === "dashboard"} icon={<BarChart3 />} label="Dashboard" badge={totalTasks} onClick={() => setView("dashboard")} />
            <NavItem active={view === "projects"} icon={<Folder />} label="Projects" badge={projects.length} onClick={() => setView("projects")} />
            <NavItem active={view === "board"} icon={<KanbanSquare />} label="Board" badge={tasks.length} onClick={() => setView("board")} />
            <NavItem active={view === "team"} icon={<Users />} label="Team" badge={members.length} onClick={() => setView("team")} />
          </div>
          <div className="nav-section">
            <div className="nav-label">Projects</div>
            {projects.map((project, index) => (
              <button
                key={project.id}
                className={`nav-item project-link ${String(project.id) === String(selectedProjectId) ? "active" : ""}`}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setView("board");
                }}
              >
                <span className={`project-dot ${palette[index % palette.length]}`} />
                {project.name}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <Avatar name={user?.name} tone="purple" />
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost full" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <div className="page-title">{pageTitle(view, selectedProject)}</div>
            <div className="page-subtitle">{selectedProject?.description || "Create a project to start assigning tasks."}</div>
          </div>
          <div className="topbar-right">
            <button className="btn-icon" title="Search"><Search size={16} /></button>
            <button className="btn btn-ghost" onClick={() => setModal("project")}><Plus size={15} /> Project</button>
            {isAdmin && <button className="btn btn-ghost" onClick={() => { setModalError(""); setModal("member"); }}><UserPlus size={15} /> Member</button>}
            {isAdmin && <button className="btn btn-primary" onClick={() => setModal("task")}><Plus size={15} /> Task</button>}
          </div>
        </header>

        <section className="content">
          {message && messageType === "error" && <p className="error banner">{message}</p>}
          {message && messageType === "success" && <div className="toast success-toast">{message}</div>}
          {view === "dashboard" && <DashboardView dashboard={dashboard} progress={progress} tasks={tasks} members={members} taskCounts={selectedProjectTaskCounts} openTaskModal={() => setModal("task")} openMemberModal={() => { setModalError(""); setModal("member"); }} isAdmin={isAdmin} />}
          {view === "projects" && <ProjectsView projects={projects} tasks={tasks} members={members} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} setView={setView} openProjectModal={() => setModal("project")} />}
          {view === "board" && <BoardView tasksByStatus={tasksByStatus} members={members} updateTaskStatus={updateTaskStatus} updateTaskAssignee={updateTaskAssignee} deleteTask={deleteTask} openTaskModal={() => setModal("task")} openMemberModal={() => { setModalError(""); setModal("member"); }} isAdmin={isAdmin} />}
          {view === "team" && <TeamView members={members} taskCounts={selectedProjectTaskCounts} isAdmin={isAdmin} currentUserId={user?.id} removeMember={removeMember} openMemberModal={() => { setModalError(""); setModal("member"); }} />}
        </section>
      </section>

      {modal === "project" && (
        <Modal title="Create Project" onClose={() => setModal(null)}>
          <form onSubmit={createProject}>
            <Field label="Project name"><input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required placeholder="API Redesign" /></Field>
            <Field label="Description"><textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What this team is building" /></Field>
            <ModalActions onClose={() => setModal(null)} label="Create Project" />
          </form>
        </Modal>
      )}

      {modal === "member" && (
        <Modal title="Add Team Member" onClose={() => setModal(null)}>
          <form onSubmit={addMember}>
            <Field label="Name"><input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required placeholder="Member name" /></Field>
            <Field label="Email"><input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required placeholder="member@email.com" /></Field>
            <Field label="Login password"><input type="password" minLength="6" value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="password123" /></Field>
            <Field label="Role">
              <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            {modalError && <p className="error modal-error">{modalError}</p>}
            <ModalActions onClose={() => setModal(null)} label="Add Member" />
          </form>
        </Modal>
      )}

      {modal === "task" && (
        <Modal title="Create New Task" onClose={() => setModal(null)}>
          <form onSubmit={createTask}>
            <Field label="Task title"><input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required placeholder="Implement password reset flow" /></Field>
            <Field label="Description"><textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Add useful details for the assignee" /></Field>
            <div className="form-row">
              <Field label="Due date"><input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></Field>
              <Field label="Priority"><select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
            </div>
            <Field label="Assignees">
              <div className="check-list">
                {members.map((member) => (
                  <label className="check-row" key={member.id}>
                    <input
                      type="checkbox"
                      checked={taskForm.assigneeIds.includes(String(member.id))}
                      onChange={(e) => setTaskForm({
                        ...taskForm,
                        assigneeIds: e.target.checked
                          ? [...taskForm.assigneeIds, String(member.id)]
                          : taskForm.assigneeIds.filter((id) => id !== String(member.id)),
                      })}
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
                {!members.length && <span className="field-help">No members in this project yet.</span>}
              </div>
              <span className="field-help">Choose any project member. Add a member first if they are not listed.</span>
            </Field>
            <ModalActions onClose={() => setModal(null)} label="Create Task" />
          </form>
        </Modal>
      )}
    </main>
  );
}

function DashboardView({ dashboard, progress, tasks, members, taskCounts, openTaskModal, openMemberModal, isAdmin }) {
  const byStatus = dashboard?.tasksByStatus || {};
  const total = dashboard?.totalTasks || 0;
  return (
    <>
      <div className="stats-grid">
        <StatCard tone="purple" icon={<ListChecks />} value={total} label="Total tasks" />
        <StatCard tone="blue" icon={<KanbanSquare />} value={byStatus.IN_PROGRESS || 0} label="In progress" />
        <StatCard tone="green" icon={<CheckCircle2 />} value={byStatus.DONE || 0} label="Completed" />
        <StatCard tone="amber" icon={<CalendarClock />} value={dashboard?.overdueTasks || 0} label="Overdue" />
      </div>
      <div className="dash-grid">
        <section className="card">
          <CardHeader
            title="Project Progress"
            action={isAdmin && (
              <div className="action-row">
                <button className="btn btn-ghost compact" onClick={openMemberModal}><UserPlus size={14} /> Add Member</button>
                <button className="btn btn-primary compact" onClick={openTaskModal}><Plus size={14} /> Add Task</button>
              </div>
            )}
          />
          <div className="card-body">
            {statuses.map((status) => (
              <ProgressRow key={status} label={statusLabels[status]} tone={statusColors[status]} count={byStatus[status] || 0} total={Math.max(total, 1)} />
            ))}
          </div>
        </section>
        <section className="card">
          <CardHeader title="Team Load" />
          <div className="card-body member-stack">
            {members.map((member, index) => (
              <div className="member-row" key={member.id}>
                <Avatar name={member.name} tone={palette[index % palette.length]} small />
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                </div>
                <span className="chip chip-blue">{taskCounts[member.id] || 0}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="card recent-card">
        <CardHeader title="Recent Tasks" />
        <div className="card-body">
          {tasks.slice(0, 6).map((task) => <TaskRow key={task.id} task={task} />)}
          {!tasks.length && <EmptyState label="No tasks yet" />}
        </div>
      </section>
    </>
  );
}

function ProjectsView({ projects, tasks, members, selectedProjectId, setSelectedProjectId, setView, openProjectModal }) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Projects</h2>
          <p>{projects.length} active workspace projects</p>
        </div>
        <button className="btn btn-primary" onClick={openProjectModal}><Plus size={15} /> New Project</button>
      </div>
      <div className="projects-grid">
        {projects.map((project, index) => {
          const active = String(project.id) === String(selectedProjectId);
          const projectTasks = active ? tasks : [];
          const done = projectTasks.filter((task) => task.status === "DONE").length;
          const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
          const tone = palette[index % palette.length];
          return (
            <button
              className={`project-card pc-${tone}`}
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setView("board");
              }}
            >
              <div className={`project-icon pi-${tone}`}><Folder size={18} /></div>
              <div className="project-name">{project.name}</div>
              <div className="project-desc">{project.description || "No description added."}</div>
              <div className="project-progress">
                <div className="pp-top"><span className="pp-label">Progress</span><span className="pp-val">{percent}%</span></div>
                <div className="pp-bar"><div className={`progress-fill pf-${tone}`} style={{ width: `${percent}%` }} /></div>
              </div>
              <div className="project-foot">
                <div className="project-members">{members.slice(0, 4).map((member, idx) => <Avatar key={member.id} name={member.name} tone={palette[idx % palette.length]} tiny />)}</div>
                <span className="proj-taskcount"><CheckCircle2 size={12} /> {active ? projectTasks.length : 0} tasks</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function BoardView({ tasksByStatus, members, updateTaskStatus, updateTaskAssignee, deleteTask, openTaskModal, openMemberModal, isAdmin }) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Kanban Board</h2>
          <p>Update task status directly from each card.</p>
        </div>
        {isAdmin && (
          <div className="action-row">
            <button className="btn btn-ghost" onClick={openMemberModal}><UserPlus size={15} /> Add Member</button>
            <button className="btn btn-primary" onClick={openTaskModal}><Plus size={15} /> Add Task</button>
          </div>
        )}
      </div>
      <div className="kanban">
        {tasksByStatus.map((column) => (
          <section className="kanban-col" key={column.status}>
            <div className="col-header">
              <span className={`col-dot ${statusColors[column.status]}`} />
              <span className="col-name">{statusLabels[column.status]}</span>
              <span className="col-count">{column.tasks.length}</span>
            </div>
            <div className="col-body">
              {column.tasks.map((task) => <TaskCard key={task.id} task={task} members={members} updateTaskStatus={updateTaskStatus} updateTaskAssignee={updateTaskAssignee} deleteTask={deleteTask} isAdmin={isAdmin} />)}
              {isAdmin && <button className="add-card" onClick={openTaskModal}><Plus size={14} /> Add task</button>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TeamView({ members, taskCounts, isAdmin, currentUserId, removeMember, openMemberModal }) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Team Members</h2>
          <p>Admins can create a login for a member and assign tasks to them.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openMemberModal}><UserPlus size={15} /> Add Member</button>}
      </div>
      <section className="card">
        <div className="table-list">
          {members.map((member, index) => (
            <div className="team-row" key={member.id}>
              <Avatar name={member.name} tone={palette[index % palette.length]} />
              <div>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <span className={`chip chip-${member.role === "ADMIN" ? "purple" : "blue"}`}>{member.role}</span>
              <span className="chip chip-green">{taskCounts[member.id] || 0} tasks</span>
              {isAdmin && member.id !== currentUserId && <button className="btn-icon danger" title="Remove member" onClick={() => removeMember(member.id)}><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function TaskCard({ task, members, updateTaskStatus, updateTaskAssignee, deleteTask, isAdmin }) {
  const tone = priorityTone[task.priority] || "purple";
  return (
    <article className={`kanban-card kc-${tone}`}>
      <div className="kcard-top">
        <div className="kcard-title">{task.title}</div>
        <div className="kcard-actions">
          <div className={`kcard-prio prio-${task.priority === "HIGH" ? "high" : task.priority === "LOW" ? "low" : "med"}`}>{task.priority[0]}</div>
          {isAdmin && <button className="task-delete" title="Delete task" onClick={() => deleteTask(task.id)}><Trash2 size={13} /></button>}
        </div>
      </div>
      {task.description && <p className="kcard-desc">{task.description}</p>}
      <div className="kcard-tags">
        <span className={`chip chip-${tone}`}>{task.priority}</span>
        <span className={`chip chip-${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
      </div>
      <div className="kcard-foot">
        <span className={`kcard-due ${isOverdue(task) ? "overdue" : ""}`}><CalendarClock size={12} /> {task.dueDate || "No due date"}</span>
        <div className="assignee-avatars">
          {taskAssignees(task).slice(0, 3).map((assignee, index) => <Avatar key={assignee.id || assignee.name} name={assignee.name} tone={palette[index % palette.length]} tiny />)}
          {!taskAssignees(task).length && <Avatar name="Unassigned" tone="blue" tiny />}
        </div>
      </div>
      <select className="status-select" value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)}>
        {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </select>
      {isAdmin && (
        <div className="mini-check-list">
          {members.map((member) => {
            const selectedIds = taskAssigneeIds(task).map(String);
            return (
              <label className="mini-check-row" key={member.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(String(member.id))}
                  onChange={(e) => updateTaskAssignee(
                    task,
                    e.target.checked
                      ? [...selectedIds, String(member.id)]
                      : selectedIds.filter((id) => id !== String(member.id))
                  )}
                />
                <span>{member.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </article>
  );
}

function TaskRow({ task }) {
  return (
    <div className={`task-row ${task.status === "DONE" ? "task-done" : ""}`}>
      <div className={`task-check ${task.status === "DONE" ? "done" : ""}`} />
      <div className="task-text">
        <div className="task-name">{task.title}</div>
        <div className="task-meta">{task.projectName} · {task.assigneeName}</div>
      </div>
      <span className={`chip chip-${priorityTone[task.priority]}`}>{task.priority}</span>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay open" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} type="button"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, label }) {
  return (
    <div className="modal-foot">
      <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" type="submit">{label}</button>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function CardHeader({ title, action }) {
  return <div className="card-header"><div className="card-title">{title}</div>{action}</div>;
}

function StatCard({ tone, icon, value, label }) {
  return (
    <div className={`stat-card s-${tone}`}>
      <div className={`stat-icon si-${tone}`}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ProgressRow({ label, tone, count, total }) {
  const percent = Math.round((count / total) * 100);
  return (
    <div className="progress-row">
      <span className="progress-label">{label}</span>
      <div className="progress-bar"><div className={`progress-fill pf-${tone}`} style={{ width: `${percent}%` }} /></div>
      <span className="progress-count">{count}</span>
    </div>
  );
}

function NavItem({ active, icon, label, badge, onClick }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{React.cloneElement(icon, { className: "nav-icon", size: 16 })}{label}<span className="badge">{badge}</span></button>;
}

function Avatar({ name = "User", tone = "purple", small = false, tiny = false }) {
  return <div className={`avatar ${small ? "avatar-sm" : ""} ${tiny ? "avatar-xs" : ""} av-${tone}`}>{initials(name)}</div>;
}

function EmptyState({ label }) {
  return <div className="empty-state">{label}</div>;
}

function initials(name = "") {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

function taskAssignees(task) {
  if (task.assignees?.length) return task.assignees;
  if (task.assigneeId) return [{ id: task.assigneeId, name: task.assigneeName }];
  return [];
}

function taskAssigneeIds(task) {
  return taskAssignees(task).map((assignee) => assignee.id).filter(Boolean);
}

function pageTitle(view, project) {
  if (view === "projects") return "Projects";
  if (view === "team") return "Team Members";
  if (view === "board") return project?.name || "Board";
  return "Dashboard";
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

createRoot(document.getElementById("root")).render(<App />);
