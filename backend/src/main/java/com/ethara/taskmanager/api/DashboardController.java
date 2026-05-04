package com.ethara.taskmanager.api;

import com.ethara.taskmanager.domain.ProjectRole;
import com.ethara.taskmanager.domain.Task;
import com.ethara.taskmanager.domain.TaskStatus;
import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import com.ethara.taskmanager.security.CurrentUserService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final TaskRepository tasks;
    private final ProjectMemberRepository members;
    private final CurrentUserService currentUserService;

    public DashboardController(TaskRepository tasks, ProjectMemberRepository members, CurrentUserService currentUserService) {
        this.tasks = tasks;
        this.members = members;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Transactional
    public DashboardResponse dashboard() {
        User user = currentUserService.requireUser();
        List<Task> visibleTasks = tasks.findVisibleTasks(user.getId()).stream()
                .filter(task -> canViewTask(user, task))
                .toList();
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            byStatus.put(status.name(), 0L);
        }
        for (Task task : visibleTasks) {
            byStatus.put(task.getStatus().name(), byStatus.get(task.getStatus().name()) + 1);
        }
        Map<String, Long> perUser = new LinkedHashMap<>();
        for (Task task : visibleTasks) {
            if (task.getAssignees().isEmpty() && task.getAssignee() == null) {
                perUser.put("Unassigned", perUser.getOrDefault("Unassigned", 0L) + 1);
            }
            if (task.getAssignee() != null && task.getAssignees().isEmpty()) {
                perUser.put(task.getAssignee().getName(), perUser.getOrDefault(task.getAssignee().getName(), 0L) + 1);
            }
            task.getAssignees().forEach(assignee -> perUser.put(assignee.getName(), perUser.getOrDefault(assignee.getName(), 0L) + 1));
        }
        long overdue = visibleTasks.stream()
                .filter(task -> task.getDueDate() != null && task.getDueDate().isBefore(LocalDate.now()) && task.getStatus() != TaskStatus.DONE)
                .count();
        return new DashboardResponse(
                visibleTasks.size(),
                byStatus,
                perUser,
                overdue
        );
    }

    private boolean canViewTask(User user, Task task) {
        boolean admin = members.existsByProjectIdAndUserIdAndRole(task.getProject().getId(), user.getId(), ProjectRole.ADMIN);
        return admin
                || (task.getAssignee() != null && task.getAssignee().getId().equals(user.getId()))
                || task.getAssignees().stream().anyMatch(assignee -> assignee.getId().equals(user.getId()));
    }

    public record DashboardResponse(long totalTasks, Map<String, Long> tasksByStatus, Map<String, Long> tasksPerUser, long overdueTasks) {
    }
}
