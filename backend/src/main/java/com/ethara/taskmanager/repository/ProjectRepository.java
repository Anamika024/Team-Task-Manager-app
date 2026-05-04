package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("select p from Project p join ProjectMember pm on pm.project = p where pm.user.id = :userId order by p.createdAt desc")
    List<Project> findVisibleProjects(@Param("userId") Long userId);
}
