import { Layers, LogOut, Plus, Search, UserPlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { NavItem } from "./NavItem";
import { palette } from "../constants";
import { workspaceRoutes } from "../routes";
import { pageTitle } from "../utils/taskUtils";

export function AppShell({
  children,
  user,
  view,
  setView,
  projects,
  selectedProject,
  selectedProjectId,
  setSelectedProjectId,
  totalTasks,
  taskCount,
  memberCount,
  isAdmin,
  openProjectModal,
  openMemberModal,
  openTaskModal,
  logout,
}) {
  const routeBadges = {
    totalTasks,
    projectCount: projects.length,
    taskCount,
    memberCount,
  };

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
            {workspaceRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <NavItem
                  key={route.id}
                  active={view === route.id}
                  icon={<Icon />}
                  label={route.label}
                  badge={routeBadges[route.badgeKey]}
                  onClick={() => setView(route.id)}
                />
              );
            })}
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
            <button className="btn btn-ghost" onClick={openProjectModal}><Plus size={15} /> Project</button>
            {isAdmin && <button className="btn btn-ghost" onClick={openMemberModal}><UserPlus size={15} /> Member</button>}
            {isAdmin && <button className="btn btn-primary" onClick={openTaskModal}><Plus size={15} /> Task</button>}
          </div>
        </header>

        <section className="content">{children}</section>
      </section>
    </main>
  );
}
