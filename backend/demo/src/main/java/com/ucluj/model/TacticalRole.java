package com.ucluj.model;

import com.ucluj.dto.request.PlayerStatsDto;
import lombok.Getter;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Getter
public enum TacticalRole {
    PLAYMAKER("Playmaker", 0.90, PlayerStatsDto::getPlaymaker),
    DESTROYER("Destroyer", 0.25, PlayerStatsDto::getDestroyer),
    TRANSPORTER("Transporter", 0.70, PlayerStatsDto::getTransporter),
    FINISHER("Finisher", 0.65, PlayerStatsDto::getFinisher),
    GUARDIAN("Guardian", 0.45, PlayerStatsDto::getGuardian),
    TARGET_MAN("Target Man", 0.35, PlayerStatsDto::getTargetMan),
    SERVICE_PROVIDER("Service Provider", 0.85, PlayerStatsDto::getServiceProvider);

    private final String displayName;
    private final double weatherSensitivity;
    private final Function<PlayerStatsDto, Double> scoreExtractor;

    TacticalRole(String displayName, double weatherSensitivity, Function<PlayerStatsDto, Double> scoreExtractor) {
        this.displayName = displayName;
        this.weatherSensitivity = weatherSensitivity;
        this.scoreExtractor = scoreExtractor;
    }

    public static Map<String, Double> getSensitivityMap() {
        return Arrays.stream(TacticalRole.values())
                .collect(Collectors.toMap(
                        role -> role.name(),
                        role -> role.weatherSensitivity
                ));
    }

    public static TacticalRole findDominantRole(PlayerStatsDto stats) {
        return Arrays.stream(TacticalRole.values())
                .max(Comparator.comparing(role -> role.scoreExtractor.apply(stats)))
                .orElse(TacticalRole.GUARDIAN);
    }

    public double getScoreFrom(PlayerStatsDto stats) {
        return this.scoreExtractor.apply(stats);
    }
}