package com.ucluj.model;

import lombok.Getter;

@Getter
public enum WeatherCondition {
    IDEAL(0.0, "Ideal Weather"),
    LIGHT_RAIN(0.15, "Light Rain"),
    EXTREME_HEAT(0.30, "Extreme Heat"),
    HEAVY_RAIN_MUD(0.50, "Torrential Rain / Mud"),
    SNOW_FREEZING(0.75, "Snow / Freezing");

    private final double harshness;
    private final String displayName;

    WeatherCondition(double harshness, String displayName) {
        this.harshness = harshness;
        this.displayName = displayName;
    }
}