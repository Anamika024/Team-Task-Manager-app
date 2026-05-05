import { priorityTone } from "../constants";

export function TaskRow({ task }) {
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
