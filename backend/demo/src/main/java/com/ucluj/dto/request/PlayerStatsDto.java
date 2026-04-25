package com.ucluj.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStatsDto {
    private Long playerId;
    private int matchesAnalyzed;

    /// These are the tasks within a team
    private double playmaker;
    private double destroyer;
    private double transporter;
    private double finisher;
    private double guardian;
    private double targetMan;
    private double serviceProvider;

    /// This is the best fit
    private String primaryRole;

    /// The resilience of the player computed for a number of past matches
    private double resilienceScore;

    ///  The weights used in the meteo calculator
    private Map<String, Double> roleSensitivities;
}