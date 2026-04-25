package com.ucluj.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ucluj.dto.MatchImportDto;
import com.ucluj.model.Player;
import com.ucluj.model.PlayerMatch;
import com.ucluj.model.Team;
import com.ucluj.repository.PlayerMatchRepository;
import com.ucluj.repository.PlayerRepository;
import com.ucluj.repository.TeamRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataIngestionService {

    private final PlayerRepository playerRepository;
    private final PlayerMatchRepository playerMatchRepository;
    private final TeamRepository teamRepository;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String MATCH_STATS_API_URL = "http://localhost:8080/api/v1/match-stats";

    @Transactional
    public void loadMatchesFromApi() {
        try {
            log.info("🚀 Fetching live match data from API: {}", MATCH_STATS_API_URL);

            String jsonResponse = restTemplate.getForObject(MATCH_STATS_API_URL, String.class);

            if (jsonResponse != null) {
                importSingleMatchFromApi(jsonResponse);
                log.info("✅ Live match data processed successfully!");
            } else {
                log.warn("⚠️ Received empty response from API.");
            }

        } catch (Exception e) {
            log.error("Failed to load match data from API", e);
        }
    }

    protected void importSingleMatchFromApi(String jsonContent) throws Exception {
        MatchImportDto data = objectMapper.readValue(jsonContent, MatchImportDto.class);

        MatchImportDto.TeamDto teamData = data.getTeam();
        Team team = null;

        if (teamData != null) {
            entityManager.createNativeQuery("INSERT INTO team (id, name) VALUES (?, ?) ON CONFLICT (id) DO NOTHING")
                    .setParameter(1, teamData.getId())
                    .setParameter(2, teamData.getName())
                    .executeUpdate();

            team = teamRepository.findById(teamData.getId()).orElse(null);
            log.info("Team synchronized for ID: {}", teamData.getId());
        }

        for (MatchImportDto.PlayerMatchData entry : data.getPlayers()) {

            Long teamId = (team != null) ? team.getId() : null;

            entityManager.createNativeQuery(
                            "INSERT INTO player (id, first_name, last_name, team_id, height, weight) " +
                                    "VALUES (?, ?, ?, ?, 0, 0) ON CONFLICT (id) DO NOTHING")
                    .setParameter(1, entry.getPlayerId())
                    .setParameter(2, "Player")
                    .setParameter(3, String.valueOf(entry.getPlayerId()))
                    .setParameter(4, teamId)
                    .executeUpdate();

            Player player = playerRepository.findById(entry.getPlayerId()).orElse(null);

            if (player != null) {
                if (!playerMatchRepository.existsByPlayerIdAndMatchId(player.getId(), entry.getMatchId())) {

                    PlayerMatch pm = new PlayerMatch();
                    pm.setPlayer(player);
                    pm.setMatchId(entry.getMatchId());
                    pm.setCompetitionId(entry.getCompetitionId());
                    pm.setSeasonId(entry.getSeasonId());
                    pm.setRoundId(entry.getRoundId());
                    pm.setTotal(entry.getTotal());
                    pm.setMatchDate(LocalDateTime.now());

                    playerMatchRepository.save(pm);
                    log.info("Successfully imported match {} for player {}", entry.getMatchId(), player.getId());
                } else {
                    log.info("Match {} for player {} already exists. Skipping.", entry.getMatchId(), player.getId());
                }
            }
        }
    }
}