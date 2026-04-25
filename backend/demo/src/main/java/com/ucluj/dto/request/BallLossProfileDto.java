package com.ucluj.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BallLossProfileDto {
    private int totalLosses;

    // Numerele absolute
    private int dangerZoneLosses;   // Red Zone (apărare)
    private int buildUpZoneLosses;  // Yellow Zone (mijloc)
    private int attackingZoneLosses;// Green Zone (atac)

    // Procentele (0.0 - 100.0) pentru UI rendering
    private double dangerZonePct;
    private double buildUpZonePct;
    private double attackingZonePct;

    // Verdictul tactic
    private String tacticalSummary;
}