package com.excalidraw.repository;

import com.excalidraw.model.Drawing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrawingRepository extends JpaRepository<Drawing, String> {

    List<Drawing> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<Drawing> findByIdAndUserId(String id, Long userId);

    @Query("SELECT d FROM Drawing d WHERE d.id = :id AND (d.user.id = :userId OR d.isPublic = true)")
    Optional<Drawing> findByIdAccessibleByUser(@Param("id") String id, @Param("userId") Long userId);
}
