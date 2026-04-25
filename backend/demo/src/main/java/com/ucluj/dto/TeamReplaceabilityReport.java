package com.ucluj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TeamReplaceabilityReport {
    private Long teamId;
    private String teamName;
    private String analyzedPlayerName;
    private List<ReplaceabilityDto> squadAnalysis;
}