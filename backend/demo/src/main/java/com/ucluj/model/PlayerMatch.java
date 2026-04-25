package com.ucluj.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "player_match")
@NoArgsConstructor
@AllArgsConstructor
public class PlayerMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="player_id")
    private Player player;

    @Column(name = "match_id")
    private Long matchId;

    private Long competitionId;
    private Long seasonId;
    private Long roundId;

    @Embedded
    private PitchType pitchType;

    @Embedded
    private PitchCondition pitchCondition;

    int temperature;

    int humidity;

    LocalDateTime matchDate;

    @ElementCollection
    private List<String> positions;

    @Embedded
    private PlayerStats total;
}
