import { CalendarClock, Trash2 } from "lucide-react";
import { palette, priorityTone, statuses, statusColors, statusLabels } from "../constants";
import { isOverdue, taskAssigneeIds, taskAssignees } from "../utils/taskUtils";
import { Avatar } from "./Avatar";

export function TaskCard({ task, members, updateTaskStatus, updateTaskAssignee, deleteTask, isAdmin }) {
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
