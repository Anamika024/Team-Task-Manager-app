import { Plus, UserPlus } from "lucide-react";
import { statusColors, statusLabels } from "../constants";
import { TaskCard } from "../components/TaskCard";

export function BoardPage({ tasksByStatus, members, updateTaskStatus, updateTaskAssignee, deleteTask, openTaskModal, openMemberModal, isAdmin }) {
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
