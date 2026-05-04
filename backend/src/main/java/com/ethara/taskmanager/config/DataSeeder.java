package com.ethara.taskmanager.config;

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
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final TaskRepository tasks;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository users, ProjectRepository projects, ProjectMemberRepository members, TaskRepository tasks, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.projects = projects;
        this.members = members;
        this.tasks = tasks;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }

        User admin = createUser("Admin User", "admin@taskflow.com", "admin123");
        User mahi = createUser("Mahi Patel", "mahi12345@gmail.com", "Mahi12345");
        User ravi = createUser("Ravi Sharma", "ravi@taskflow.com", "password123");
        User priya = createUser("Priya Singh", "priya@taskflow.com", "password123");

        Project webApp = createProject("Team Task Manager", "Collaborative task planning, assignment, and progress tracking.", admin);
        addMember(webApp, admin, ProjectRole.ADMIN);
        addMember(webApp, mahi, ProjectRole.MEMBER);
        addMember(webApp, ravi, ProjectRole.MEMBER);
        addMember(webApp, priya, ProjectRole.MEMBER);

        Project launch = createProject("Product Launch", "Marketing checklist and release preparation for the next launch.", admin);
        addMember(launch, admin, ProjectRole.ADMIN);
        addMember(launch, mahi, ProjectRole.MEMBER);
        addMember(launch, priya, ProjectRole.MEMBER);

        createTask(webApp, admin, "Design project dashboard", "Add summary cards for total, overdue, progress, and workload.", TaskPriority.HIGH, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(2), List.of(mahi, priya));
        createTask(webApp, admin, "Implement multi-member assignment", "Allow one task to be assigned to several project members.", TaskPriority.HIGH, TaskStatus.TO_DO, LocalDate.now().plusDays(4), List.of(mahi, ravi));
        createTask(webApp, admin, "Write README deployment steps", "Document local PostgreSQL setup and Railway deployment.", TaskPriority.MEDIUM, TaskStatus.DONE, LocalDate.now().minusDays(1), List.of(ravi));
        createTask(webApp, admin, "Test member status updates", "Login as a member and verify assigned tasks can be moved.", TaskPriority.MEDIUM, TaskStatus.TO_DO, LocalDate.now().plusDays(5), List.of(priya));

        createTask(launch, admin, "Prepare launch checklist", "Create the final release checklist for marketing and engineering.", TaskPriority.MEDIUM, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(3), List.of(mahi));
        createTask(launch, admin, "Review landing copy", "Check headline, CTA text, and product positioning.", TaskPriority.LOW, TaskStatus.TO_DO, LocalDate.now().plusDays(7), List.of(priya, admin));
    }

    private User createUser(String name, String email, String password) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        return users.save(user);
    }

    private Project createProject(String name, String description, User creator) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setCreatedBy(creator);
        return projects.save(project);
    }

    private void addMember(Project project, User user, ProjectRole role) {
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
