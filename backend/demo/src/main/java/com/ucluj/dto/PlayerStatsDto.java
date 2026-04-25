package com.ucluj.dto;

import lombok.Data;
import java.util.Map;

@Data
public class PlayerStatsDto {
    private Long playerId;

    // --- METRICE GENERALE DE ANALIZĂ ---
    private int matchesAnalyzed;
    private double resilienceScore;
    private Map<String, Double> roleSensitivities;

    // --- ROLURI TACTICE ---
    private double playmaker;
    private double destroyer;
    private double transporter;
    private double finisher;
    private double guardian;
    private double targetMan;
    private double serviceProvider;

    // --- DATE BRUTE PENTRU REACT (Aici era problema, trebuie să fie DOUBLE) ---
    private double rating;
    private double goals;
    private double assists;
    private double minutesOnField;
    private double duelsWon;
    private double successfulPasses;
    private double recoveries;
}