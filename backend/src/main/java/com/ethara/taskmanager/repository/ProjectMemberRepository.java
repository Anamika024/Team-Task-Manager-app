package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.domain.ProjectMember;
import com.ethara.taskmanager.domain.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    @Query("select pm from ProjectMember pm join fetch pm.user where pm.project.id = :projectId order by pm.role asc, pm.user.name asc")
    List<ProjectMember> findByProjectIdOrderByRoleAscUserNameAsc(@Param("projectId") Long projectId);

    boolean existsByProjectIdAndUserIdAndRole(Long projectId, Long userId, ProjectRole role);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);
}
