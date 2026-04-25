package com.ucluj.repository;

import com.ucluj.dto.PlayerNameDTO;
import com.ucluj.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    @Query("SELECT p FROM Player p WHERE p.team.id = :teamId")
    List<Player> findAllByTeam(Long teamId);

    @Query("SELECT p FROM Player p WHERE p.id = :id")
    Optional<Player> findById(Long id);

    @Query("SELECT new com.ucluj.dto.PlayerNameDTO(p.id, p.firstName, p.lastName) FROM Player p ORDER BY p.lastName")
    List<PlayerNameDTO> findAllProjected();
}
