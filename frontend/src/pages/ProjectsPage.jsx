import { CheckCircle2, Folder, Plus } from "lucide-react";
import { palette } from "../constants";
import { Avatar } from "../components/Avatar";

export function ProjectsPage({ projects, tasks, members, selectedProjectId, setSelectedProjectId, setView, openProjectModal }) {
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
