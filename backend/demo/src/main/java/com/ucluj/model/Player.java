package com.ucluj.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name="player")
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    @Id
    private Long id;

    private String firstName;
    private String lastName;
    private int height;
    private int weight;

    @Column(length = 2)
    private String nationality;

    @Enumerated(EnumType.STRING)
    private BodyType bodyType;

    @Enumerated(EnumType.STRING)
    private AccelerationTypes accelerationTypes;

    @Enumerated(EnumType.STRING)
    private PersonalityType personality;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
