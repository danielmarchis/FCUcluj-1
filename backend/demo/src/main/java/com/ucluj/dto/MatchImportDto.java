package com.ucluj.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ucluj.model.PlayerStats;
import lombok.Data;
import java.util.List;

@Data
public class MatchImportDto {

    private TeamDto team;
    private List<PlayerMatchData> players;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeamDto {
        private Long id;
        private String name;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PlayerMatchData {
        private Long playerId;
        private Long matchId;
        private Long competitionId;
        private Long seasonId;
        private Long roundId;

        private List<PositionWrapper> positions;

        private PlayerStats total;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PositionWrapper {
        private PositionDetail position;
        private Integer percent;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PositionDetail {
        private String name;
        private String code;
    }
}