package com.ethara.taskmanager.api;

import com.ethara.taskmanager.domain.Project;
import com.ethara.taskmanager.domain.ProjectRole;
import com.ethara.taskmanager.domain.Task;
import com.ethara.taskmanager.domain.TaskPriority;
import com.ethara.taskmanager.domain.TaskStatus;
import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.ProjectRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import com.ethara.taskmanager.repository.UserRepository;
import com.ethara.taskmanager.security.CurrentUserService;
import com.ethara.taskmanager.service.AccessService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final UserRepository users;
    private final ProjectMemberRepository members;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;

    public TaskController(TaskRepository tasks, ProjectRepository projects, UserRepository users, ProjectMemberRepository members, CurrentUserService currentUserService, AccessService accessService) {
        this.tasks = tasks;
        this.projects = projects;
        this.users = users;
        this.members = members;
        this.currentUserService = currentUserService;
        this.accessService = accessService;
    }

    @GetMapping
    @Transactional
    public List<TaskResponse> list(@RequestParam(required = false) Long projectId) {
        User user = currentUserService.requireUser();
        List<Task> visible = tasks.findVisibleTasks(user.getId());
        return visible.stream()
                .filter(task -> projectId == null || task.getProject().getId().equals(projectId))
                .filter(task -> canViewTask(user, task))
                .map(TaskResponse::from)
                .toList();
    }

    @PostMapping
    @Transactional
    public TaskResponse create(@Valid @RequestBody TaskRequest request) {
        User user = currentUserService.requireUser();
        Project project = projects.findById(request.projectId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
        accessService.requireAdmin(project.getId(), user);
        Task task = new Task();
        applyTaskRequest(task, request, project, user);
        return TaskResponse.from(tasks.save(task));
    }

    @PutMapping("/{taskId}")
    @Transactional
    public TaskResponse update(@PathVariable Long taskId, @Valid @RequestBody TaskRequest request) {
        User user = currentUserService.requireUser();
        Task task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        accessService.requireAdmin(task.getProject().getId(), user);
        Project project = projects.findById(request.projectId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
        accessService.requireAdmin(project.getId(), user);
        applyTaskRequest(task, request, project, task.getCreatedBy());
        task.setUpdatedAt(Instant.now());
        return TaskResponse.from(tasks.save(task));
    }

    @PatchMapping("/{taskId}/status")
    @Transactional
    public TaskResponse updateStatus(@PathVariable Long taskId, @Valid @RequestBody StatusRequest request) {
        User user = currentUserService.requireUser();
        Task task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        accessService.requireMember(task.getProject().getId(), user);
        boolean admin = members.existsByProjectIdAndUserIdAndRole(task.getProject().getId(), user.getId(), ProjectRole.ADMIN);
        if (!admin && (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId()))) {
            boolean assignedInGroup = task.getAssignees().stream().anyMatch(assignee -> assignee.getId().equals(user.getId()));
            if (!assignedInGroup) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Members can update only their assigned tasks");
            }
        }
        if (!admin && task.getAssignee() != null && !task.getAssignee().getId().equals(user.getId())) {
            boolean assignedInGroup = task.getAssignees().stream().anyMatch(assignee -> assignee.getId().equals(user.getId()));
            if (!assignedInGroup) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Members can update only their assigned tasks");
            }
        }
        if (!admin && task.getAssignee() == null && task.getAssignees().stream().noneMatch(assignee -> assignee.getId().equals(user.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Members can update only their assigned tasks");
        }
        task.setStatus(request.status());
        task.setUpdatedAt(Instant.now());
        return TaskResponse.from(tasks.save(task));
    }

    @PatchMapping("/{taskId}/assignee")
    @Transactional
    public TaskResponse updateAssignee(@PathVariable Long taskId, @Valid @RequestBody AssignmentRequest request) {
        User user = currentUserService.requireUser();
        Task task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        accessService.requireAdmin(task.getProject().getId(), user);
        applyAssignees(task, task.getProject(), request.assigneeIds(), request.assigneeId());
        task.setUpdatedAt(Instant.now());
        return TaskResponse.from(tasks.save(task));
    }

    @DeleteMapping("/{taskId}")
    @Transactional
    public void delete(@PathVariable Long taskId) {
        User user = currentUserService.requireUser();
        Task task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
        accessService.requireAdmin(task.getProject().getId(), user);
        tasks.delete(task);
    }

    private void applyTaskRequest(Task task, TaskRequest request, Project project, User creator) {
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        task.setPriority(request.priority() == null ? TaskPriority.MEDIUM : request.priority());
        task.setStatus(request.status() == null ? TaskStatus.TO_DO : request.status());
        task.setProject(project);
        task.setCreatedBy(creator);
        applyAssignees(task, project, request.assigneeIds(), request.assigneeId());
    }

    private void applyAssignees(Task task, Project project, List<Long> assigneeIds, Long legacyAssigneeId) {
        List<Long> ids = assigneeIds == null ? List.of() : assigneeIds;
        if (ids.isEmpty() && legacyAssigneeId != null) {
            ids = List.of(legacyAssigneeId);
        }
        Set<User> nextAssignees = new LinkedHashSet<>();
        for (Long id : ids) {
            User assignee = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignee not found"));
            accessService.requireMember(project.getId(), assignee);
            nextAssignees.add(assignee);
        }
        task.getAssignees().clear();
        task.getAssignees().addAll(nextAssignees);
        task.setAssignee(nextAssignees.stream().findFirst().orElse(null));
    }

    private boolean canViewTask(User user, Task task) {
        boolean admin = members.existsByProjectIdAndUserIdAndRole(task.getProject().getId(), user.getId(), ProjectRole.ADMIN);
        return admin
                || (task.getAssignee() != null && task.getAssignee().getId().equals(user.getId()))
                || task.getAssignees().stream().anyMatch(assignee -> assignee.getId().equals(user.getId()));
    }

    public record TaskRequest(
            @NotNull Long projectId,
            @NotBlank String title,
            String description,
            LocalDate dueDate,
            TaskPriority priority,
            TaskStatus status,
            Long assigneeId,
            List<Long> assigneeIds
    ) {
    }

    public record StatusRequest(@NotNull TaskStatus status) {
    }

    public record AssignmentRequest(Long assigneeId, List<Long> assigneeIds) {
    }

    public record TaskResponse(
            Long id,
            Long projectId,
            String projectName,
            String title,
            String description,
            LocalDate dueDate,
            TaskPriority priority,
            TaskStatus status,
            Long assigneeId,
            String assigneeName,
            List<AuthController.UserResponse> assignees,
            Long createdById
    ) {
        static TaskResponse from(Task task) {
            List<User> assigneeList = task.getAssignees().isEmpty()
                    ? (task.getAssignee() == null ? List.of() : List.of(task.getAssignee()))
                    : task.getAssignees().stream().toList();
            User assignee = assigneeList.stream().findFirst().orElse(null);
            return new TaskResponse(
                    task.getId(),
                    task.getProject().getId(),
                    task.getProject().getName(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getDueDate(),
                    task.getPriority(),
                    task.getStatus(),
                    assignee == null ? null : assignee.getId(),
                    assigneeList.isEmpty() ? "Unassigned" : assigneeList.stream().map(User::getName).reduce((a, b) -> a + ", " + b).orElse("Unassigned"),
                    assigneeList.stream().map(AuthController.UserResponse::from).toList(),
                    task.getCreatedBy().getId()
            );
        }
    }
}
