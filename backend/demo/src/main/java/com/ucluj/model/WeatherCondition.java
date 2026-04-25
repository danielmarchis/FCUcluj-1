package com.ucluj.model;

import lombok.Getter;

@Getter
public enum WeatherCondition {
    IDEAL(0.0, "Ideal Weather"),
    LIGHT_RAIN(0.10, "Light Rain"),
    EXTREME_HEAT(0.20, "Extreme Heat"),
    HEAVY_RAIN_MUD(0.25, "Torrential Rain / Mud"),
    SNOW_FREEZING(0.35, "Snow / Freezing");

    private final double harshness;
    private final String displayName;

    WeatherCondition(double harshness, String displayName) {
        this.harshness = harshness;
        this.displayName = displayName;
    }
}