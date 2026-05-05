import { CalendarClock, CheckCircle2, KanbanSquare, ListChecks, Plus, UserPlus } from "lucide-react";
import { statuses, statusColors, statusLabels } from "../constants";
import { Avatar } from "../components/Avatar";
import { CardHeader, EmptyState, ProgressRow, StatCard } from "../components/ui";
import { TaskRow } from "../components/TaskRow";

export function DashboardPage({ dashboard, tasks, members, taskCounts, openTaskModal, openMemberModal, isAdmin }) {
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
                <Avatar name={member.name} tone={["purple", "blue", "green", "amber", "red"][index % 5]} small />
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
