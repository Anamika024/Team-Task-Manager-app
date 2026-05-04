package com.ethara.taskmanager.api;

import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.UserRepository;
import com.ethara.taskmanager.security.CurrentUserService;
import com.ethara.taskmanager.security.JwtService;
import com.ethara.taskmanager.service.StarterWorkspaceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;
    private final StarterWorkspaceService starterWorkspaceService;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService, CurrentUserService currentUserService, StarterWorkspaceService starterWorkspaceService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
        this.starterWorkspaceService = starterWorkspaceService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        users.save(user);
        starterWorkspaceService.ensureStarterWorkspace(user);
        return AuthResponse.from(user, jwtService.createToken(user.getEmail()));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        starterWorkspaceService.ensureStarterWorkspace(user);
        return AuthResponse.from(user, jwtService.createToken(user.getEmail()));
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUserService.requireUser());
    }

    public record SignupRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {
    }

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, UserResponse user) {
        static AuthResponse from(User user, String token) {
            return new AuthResponse(token, UserResponse.from(user));
        }
    }

    public record UserResponse(Long id, String name, String email) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getName(), user.getEmail());
        }
    }
}
