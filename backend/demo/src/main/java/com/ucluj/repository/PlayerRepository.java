package com.ucluj.repository;

import com.ucluj.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Long, Player> {

    @Query("SELECT p FROM Player p WHERE p.team.id = :teamId")
    List<Player> findAllByTeam(Long teamId);

    @Query("SELECT p FROM Player p WHERE p.id = :id")
    Optional<Player> findById(Long id);
}
