package com.ucluj.controller;

import com.ucluj.dto.request.PlayerStatsDto;
import com.ucluj.dto.request.ReplaceabilityDto;
import com.ucluj.dto.request.TeamReplaceabilityReport;
import org.apache.coyote.Response;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ucluj.service.GeneralService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PlayerController {

    private GeneralService service;

    @GetMapping("/player-stats/{playerId}")
    ResponseEntity<?> getPlayerData(@PathVariable Long playerId, @RequestParam(defaultValue = "5")  int n){

        PlayerStatsDto response = service.determineStats(playerId, n);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/player-evolution/{playerId}")
    ResponseEntity<?> getPlayerEvolution(@PathVariable Long playerId, @RequestParam(defaultValue = "5")  int n){

        List<PlayerStatsDto> response = service.getPerformanceHistory(playerId, n);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/player-stats/weather-resilience/{playerId}")
    ResponseEntity<?> getPlayerWeatherResilience(@PathVariable Long playerId, @RequestParam(defaultValue = "5")  int n){

        Map<String, PlayerStatsDto> response = service.getClimateProfile(playerId, n);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/player-stats/chemistry/players/{player1Id}/{player2Id}")
    ResponseEntity<?> getChemistryBetweenPlayers(@PathVariable Long player1Id, @PathVariable Long player2Id, @RequestParam(defaultValue = "20")  int n){

        Map<String, Object> response = service.calculatePairChemistry(player1Id, player2Id, n);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/player-stats/chemistry/teams/{teamId}")
    ResponseEntity<?> getTeamChemistryMatrix(@PathVariable Long teamId, @RequestParam(defaultValue = "20")  int n){

        List<Map<String, Object>> response = service.calculateTeamChemistry(teamId, n);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/player-stats/replace-player/{playerId}")
    public ResponseEntity<?> getBackupTeamQuality(
            @PathVariable Long playerId,
            @RequestParam(defaultValue = "20") int n) {

        TeamReplaceabilityReport response = service.generatePlayerReplacementReport(playerId, n);

        return ResponseEntity.ok(response);
    }
}
