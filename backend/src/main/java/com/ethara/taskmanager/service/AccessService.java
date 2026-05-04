package com.ethara.taskmanager.service;

import com.ethara.taskmanager.api.ApiException;
import com.ethara.taskmanager.domain.ProjectMember;
import com.ethara.taskmanager.domain.ProjectRole;
import com.ethara.taskmanager.domain.User;
import com.ethara.taskmanager.repository.ProjectMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AccessService {
    private final ProjectMemberRepository members;

    public AccessService(ProjectMemberRepository members) {
        this.members = members;
    }

    public ProjectMember requireMember(Long projectId, User user) {
        return members.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this project"));
    }

    public ProjectMember requireAdmin(Long projectId, User user) {
        ProjectMember member = requireMember(projectId, user);
        if (member.getRole() != ProjectRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only project admins can perform this action");
        }
        return member;
    }
}
