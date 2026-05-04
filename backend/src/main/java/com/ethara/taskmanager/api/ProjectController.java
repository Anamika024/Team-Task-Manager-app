package com.ethara.taskmanager.api;

import com.ethara.taskmanager.domain.Project;
import com.ethara.taskmanager.domain.ProjectMember;
import com.ethara.taskmanager.domain.ProjectRole;
import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import com.ethara.taskmanager.repository.ProjectRepository;
import com.ethara.taskmanager.repository.UserRepository;
import com.ethara.taskmanager.security.CurrentUserService;
import com.ethara.taskmanager.service.AccessService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final UserRepository users;
    private final CurrentUserService currentUserService;
    private final AccessService accessService;
    private final PasswordEncoder passwordEncoder;

    public ProjectController(ProjectRepository projects, ProjectMemberRepository members, UserRepository users, CurrentUserService currentUserService, AccessService accessService, PasswordEncoder passwordEncoder) {
        this.projects = projects;
        this.members = members;
        this.users = users;
        this.currentUserService = currentUserService;
        this.accessService = accessService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @Transactional
    public List<ProjectResponse> list() {
        User user = currentUserService.requireUser();
        return projects.findVisibleProjects(user.getId()).stream().map(project -> ProjectResponse.from(project, members.findByProjectIdAndUserId(project.getId(), user.getId()).orElseThrow().getRole())).toList();
    }

    @PostMapping
    @Transactional
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request) {
        User user = currentUserService.requireUser();
        Project project = new Project();
        project.setName(request.name().trim());
        project.setDescription(request.description());
        project.setCreatedBy(user);
        projects.save(project);

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(ProjectRole.ADMIN);
        members.save(member);
        return ProjectResponse.from(project, ProjectRole.ADMIN);
    }

    @GetMapping("/{projectId}/members")
    @Transactional
    public List<MemberResponse> members(@PathVariable Long projectId) {
        User user = currentUserService.requireUser();
        accessService.requireMember(projectId, user);
        return members.findByProjectIdOrderByRoleAscUserNameAsc(projectId).stream().map(MemberResponse::from).toList();
    }

    @PostMapping("/{projectId}/members")
    @Transactional
    public MemberResponse addMember(@PathVariable Long projectId, @Valid @RequestBody AddMemberRequest request) {
        User current = currentUserService.requireUser();
        Project project = projects.findById(projectId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
        accessService.requireAdmin(projectId, current);
        User user = users.findByEmailIgnoreCase(request.email()).orElseGet(() -> createUserFromMemberRequest(request));
        ProjectMember member = members.findByProjectIdAndUserId(projectId, user.getId()).orElseGet(ProjectMember::new);
        member.setProject(project);
        member.setUser(user);
        member.setRole(request.role() == null ? ProjectRole.MEMBER : request.role());
        return MemberResponse.from(members.save(member));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @Transactional
    public void removeMember(@PathVariable Long projectId, @PathVariable Long userId) {
        User current = currentUserService.requireUser();
        accessService.requireAdmin(projectId, current);
        if (current.getId().equals(userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot remove themselves");
        }
        members.deleteByProjectIdAndUserId(projectId, userId);
    }

    public record ProjectRequest(@NotBlank String name, String description) {
    }

    private User createUserFromMemberRequest(AddMemberRequest request) {
        String password = request.password() == null || request.password().isBlank() ? "password123" : request.password();
        if (request.name() == null || request.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Name is required for a new member");
        }
        if (password.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        return users.save(user);
    }

    public record AddMemberRequest(String name, @Email @NotBlank String email, String password, ProjectRole role) {
    }

    public record ProjectResponse(Long id, String name, String description, Long createdById, ProjectRole role) {
        static ProjectResponse from(Project project, ProjectRole role) {
            return new ProjectResponse(project.getId(), project.getName(), project.getDescription(), project.getCreatedBy().getId(), role);
        }
    }

    public record MemberResponse(Long id, String name, String email, ProjectRole role) {
        static MemberResponse from(ProjectMember member) {
            User user = member.getUser();
            return new MemberResponse(user.getId(), user.getName(), user.getEmail(), member.getRole());
        }
    }
}
