export function taskAssignees(task) {
  if (task.assignees?.length) return task.assignees;
  if (task.assigneeId) return [{ id: task.assigneeId, name: task.assigneeName }];
  return [];
}

export function taskAssigneeIds(task) {
  return taskAssignees(task).map((assignee) => assignee.id).filter(Boolean);
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

export function initials(name = "") {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

export function pageTitle(view, project) {
  if (view === "projects") return "Projects";
  if (view === "team") return "Team Members";
  if (view === "board") return project?.name || "Board";
  return "Dashboard";
}
