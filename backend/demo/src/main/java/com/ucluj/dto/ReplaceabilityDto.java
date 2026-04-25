package com.ucluj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReplaceabilityDto {
    private Long playerId;
    private String playerName;
    private String dominantRole;
    private double roleScore;

    private String backupName;
    private double backupScore;

    private double dropOffDelta;
    private String riskLevel;
}