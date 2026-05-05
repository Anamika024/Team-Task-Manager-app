import { BarChart3, Folder, KanbanSquare, Users } from "lucide-react";

export const workspaceRoutes = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, badgeKey: "totalTasks" },
  { id: "projects", label: "Projects", icon: Folder, badgeKey: "projectCount" },
  { id: "board", label: "Board", icon: KanbanSquare, badgeKey: "taskCount" },
  { id: "team", label: "Team", icon: Users, badgeKey: "memberCount" },
];
