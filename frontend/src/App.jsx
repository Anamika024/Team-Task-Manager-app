import { useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import { priorities, statuses } from "./constants";
import { Modal, ModalActions, Field } from "./components/ui";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { BoardPage } from "./pages/BoardPage";
import { TeamPage } from "./pages/TeamPage";
import { taskAssigneeIds } from "./utils/taskUtils";

const emptyProject = { name: "", description: "" };
const emptyMember = { name: "", email: "", password: "", role: "MEMBER" };
const emptyTask = { title: "", description: "", dueDate: "", priority: "MEDIUM", assigneeIds: [] };

export default function App() {
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
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [taskForm, setTaskForm] = useState(emptyTask);

  const selectedProject = projects.find((project) => String(project.id) === String(selectedProjectId));
  const isAdmin = selectedProject?.role === "ADMIN";
  const totalTasks = dashboard?.totalTasks ?? 0;

  async function loadApp(keepProjectId = selectedProjectId) {
    const [me, projectList, stats] = await Promise.all([api("/auth/me"), api("/projects"), api("/dashboard")]);
    setUser(me);
    setProjects(projectList);
    setDashboard(stats);
    const hasKeptProject = projectList.some((project) => String(project.id) === String(keepProjectId));
    const nextProjectId = hasKeptProject ? keepProjectId : projectList[0]?.id || "";
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
      setSelectedProjectId("");
      setProjects([]);
      setMembers([]);
      setTasks([]);
      setDashboard(null);
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
    setProjectForm(emptyProject);
    closeModal();
    await loadApp(project.id);
  }

  async function addMember(event) {
    event.preventDefault();
    setModalError("");
    setMessage("");
    try {
      await api(`/projects/${selectedProjectId}/members`, { method: "POST", body: JSON.stringify(memberForm) });
      setMemberForm(emptyMember);
      closeModal();
      setMessage("Member added successfully.");
      setMessageType("success");
      await loadApp(selectedProjectId);
      setView("team");
    } catch (error) {
      setModalError(error.message);
    }
  }

  async function removeMember(userId) {
    await api(`/projects/${selectedProjectId}/members/${userId}`, { method: "DELETE" });
    await loadApp(selectedProjectId);
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
    setTaskForm(emptyTask);
    closeModal();
    await loadApp(selectedProjectId);
  }

  async function updateTaskStatus(taskId, status) {
    await api(`/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadApp(selectedProjectId);
  }

  async function updateTaskAssignee(task, assigneeIds) {
    await api(`/tasks/${task.id}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeIds: assigneeIds.map(Number) }),
    });
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
    setProjects([]);
    setSelectedProjectId("");
    setMembers([]);
    setTasks([]);
    setDashboard(null);
    setMessage("");
    setMessageType("error");
  }

  function openModal(name) {
    setModalError("");
    setModal(name);
  }

  function closeModal() {
    setModalError("");
    setModal(null);
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
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        message={message}
        onSubmit={submitAuth}
      />
    );
  }

  return (
    <AppShell
      user={user}
      view={view}
      setView={setView}
      projects={projects}
      selectedProject={selectedProject}
      selectedProjectId={selectedProjectId}
      setSelectedProjectId={setSelectedProjectId}
      totalTasks={totalTasks}
      taskCount={tasks.length}
      memberCount={members.length}
      isAdmin={isAdmin}
      openProjectModal={() => openModal("project")}
      openMemberModal={() => openModal("member")}
      openTaskModal={() => openModal("task")}
      logout={logout}
    >
      {message && messageType === "error" && <p className="error banner">{message}</p>}
      {message && messageType === "success" && <div className="toast success-toast">{message}</div>}

      {view === "dashboard" && (
        <DashboardPage dashboard={dashboard} tasks={tasks} members={members} taskCounts={selectedProjectTaskCounts} openTaskModal={() => openModal("task")} openMemberModal={() => openModal("member")} isAdmin={isAdmin} />
      )}
      {view === "projects" && (
        <ProjectsPage projects={projects} tasks={tasks} members={members} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} setView={setView} openProjectModal={() => openModal("project")} />
      )}
      {view === "board" && (
        <BoardPage tasksByStatus={tasksByStatus} members={members} updateTaskStatus={updateTaskStatus} updateTaskAssignee={updateTaskAssignee} deleteTask={deleteTask} openTaskModal={() => openModal("task")} openMemberModal={() => openModal("member")} isAdmin={isAdmin} />
      )}
      {view === "team" && (
        <TeamPage members={members} taskCounts={selectedProjectTaskCounts} isAdmin={isAdmin} currentUserId={user?.id} removeMember={removeMember} openMemberModal={() => openModal("member")} />
      )}

      <ProjectModal modal={modal} closeModal={closeModal} projectForm={projectForm} setProjectForm={setProjectForm} createProject={createProject} />
      <MemberModal modal={modal} closeModal={closeModal} memberForm={memberForm} setMemberForm={setMemberForm} addMember={addMember} modalError={modalError} />
      <TaskModal modal={modal} closeModal={closeModal} taskForm={taskForm} setTaskForm={setTaskForm} members={members} createTask={createTask} />
    </AppShell>
  );
}

function ProjectModal({ modal, closeModal, projectForm, setProjectForm, createProject }) {
  if (modal !== "project") return null;
  return (
    <Modal title="Create Project" onClose={closeModal}>
      <form onSubmit={createProject}>
        <Field label="Project name"><input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required placeholder="API Redesign" /></Field>
        <Field label="Description"><textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What this team is building" /></Field>
        <ModalActions onClose={closeModal} label="Create Project" />
      </form>
    </Modal>
  );
}

function MemberModal({ modal, closeModal, memberForm, setMemberForm, addMember, modalError }) {
  if (modal !== "member") return null;
  return (
    <Modal title="Add Team Member" onClose={closeModal}>
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
        <ModalActions onClose={closeModal} label="Add Member" />
      </form>
    </Modal>
  );
}

function TaskModal({ modal, closeModal, taskForm, setTaskForm, members, createTask }) {
  if (modal !== "task") return null;
  return (
    <Modal title="Create New Task" onClose={closeModal}>
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
        <ModalActions onClose={closeModal} label="Create Task" />
      </form>
    </Modal>
  );
}
