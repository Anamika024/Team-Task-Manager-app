package com.ethara.taskmanager.repository;

import com.ethara.taskmanager.domain.Task;
import com.ethara.taskmanager.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    @Query("""
            select t from Task t
            join ProjectMember pm on pm.project = t.project
            where pm.user.id = :userId
            order by t.updatedAt desc
            """)
    List<Task> findVisibleTasks(@Param("userId") Long userId);

    List<Task> findByAssigneeIdOrderByUpdatedAtDesc(Long assigneeId);

    long countByAssigneeId(Long assigneeId);

    long countByAssigneeIdAndStatus(Long assigneeId, TaskStatus status);

    long countByAssigneeIdAndDueDateBeforeAndStatusNot(Long assigneeId, LocalDate dueDate, TaskStatus status);

    @Query("""
            select count(t) from Task t
            join ProjectMember pm on pm.project = t.project
            where pm.user.id = :userId
            """)
    long countVisibleTasks(@Param("userId") Long userId);

    @Query("""
            select t.status, count(t) from Task t
            join ProjectMember pm on pm.project = t.project
            where pm.user.id = :userId
            group by t.status
            """)
    List<Object[]> countVisibleByStatus(@Param("userId") Long userId);

    @Query("""
            select coalesce(u.name, 'Unassigned'), count(t) from Task t
            join ProjectMember pm on pm.project = t.project
            left join t.assignees u
            where pm.user.id = :userId
            group by u.name
            order by count(t) desc
            """)
    List<Object[]> countVisibleByAssignee(@Param("userId") Long userId);

    @Query("""
            select count(t) from Task t
            join ProjectMember pm on pm.project = t.project
            where pm.user.id = :userId and t.dueDate < :today and t.status <> :done
            """)
    long countVisibleOverdue(@Param("userId") Long userId, @Param("today") LocalDate today, @Param("done") TaskStatus done);
}
