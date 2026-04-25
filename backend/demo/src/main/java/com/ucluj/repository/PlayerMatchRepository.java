package com.ucluj.repository;

import com.ucluj.model.PlayerMatch;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlayerMatchRepository extends JpaRepository<PlayerMatch, Long> {

    @Query("SELECT pm FROM PlayerMatch pm WHERE pm.player.id = :playerId ORDER BY pm.match_id DESC")
    List<PlayerMatch> findRecentMatches(Long playerId, Pageable pageable);

    @Query("SELECT pm FROM PlayerMatch pm WHERE pm.player.id IN :playerIds ORDER BY pm.matchDate DESC")
    List<PlayerMatch> findAllByPlayerIdIn(@Param("playerIds") List<Long> playerIds);
}
