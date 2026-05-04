package com.ethara.taskmanager.service;

import com.ethara.taskmanager.domain.Project;
import com.ethara.taskmanager.domain.ProjectMember;
import com.ethara.taskmanager.domain.ProjectRole;
import com.ethara.taskmanager.domain.Task;
import com.ethara.taskmanager.domain.TaskPriority;
import com.ethara.taskmanager.domain.TaskStatus;
import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.ProjectRepository;
import com.ethara.taskmanager.repository.TaskRepository;
import com.ethara.taskmanager.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StarterWorkspaceService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final TaskRepository tasks;
    private final PasswordEncoder passwordEncoder;

    public StarterWorkspaceService(UserRepository users, ProjectRepository projects, ProjectMemberRepository members, TaskRepository tasks, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.projects = projects;
        this.members = members;
        this.tasks = tasks;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void ensureStarterWorkspace(User owner) {
        if (!projects.findVisibleProjects(owner.getId()).isEmpty()) {
            return;
        }

        User demoMember = user("Demo Member", "demo.member@taskflow.com", "password123");
        User qaMember = user("QA Member", "qa.member@taskflow.com", "password123");

        Project project = new Project();
        project.setName("Starter Workspace");
        project.setDescription("Default project with sample members and assigned tasks.");
        project.setCreatedBy(owner);
        projects.save(project);

        addMember(project, owner, ProjectRole.ADMIN);
        addMember(project, demoMember, ProjectRole.MEMBER);
        addMember(project, qaMember, ProjectRole.MEMBER);

        createTask(project, owner, "Plan project workflow", "Review project goals, team roles, and first sprint tasks.", TaskPriority.HIGH, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(2), List.of(owner, demoMember));
        createTask(project, owner, "Build task board", "Create tasks, assign members, and move work across statuses.", TaskPriority.MEDIUM, TaskStatus.TO_DO, LocalDate.now().plusDays(4), List.of(demoMember));
        createTask(project, owner, "Verify member permissions", "Login as a member and confirm they only see assigned tasks.", TaskPriority.MEDIUM, TaskStatus.TO_DO, LocalDate.now().plusDays(5), List.of(qaMember));
        createTask(project, owner, "Prepare demo notes", "Document signup, project creation, assignment, and dashboard behavior.", TaskPriority.LOW, TaskStatus.DONE, LocalDate.now().minusDays(1), List.of(owner, qaMember));
    }

    private User user(String name, String email, String password) {
        return users.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            return users.save(user);
        });
    }

    private void addMember(Project project, User user, ProjectRole role) {
        if (members.findByProjectIdAndUserId(project.getId(), user.getId()).isPresent()) {
            return;
        }
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(role);
        members.save(member);
    }

    private void createTask(Project project, User creator, String title, String description, TaskPriority priority, TaskStatus status, LocalDate dueDate, List<User> assignees) {
        Task task = new Task();
        task.setProject(project);
        task.setCreatedBy(creator);
        task.setTitle(title);
        task.setDescription(description);
        task.setPriority(priority);
        task.setStatus(status);
        task.setDueDate(dueDate);
        task.getAssignees().addAll(assignees);
        task.setAssignee(assignees.isEmpty() ? null : assignees.get(0));
        tasks.save(task);
    }
}
