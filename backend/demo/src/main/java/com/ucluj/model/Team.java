package com.ucluj.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Data
@Entity
@Table(name="team")
@NoArgsConstructor
@AllArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String city;
    private String stadiumName;
    private String logoUrl;

    @ToString.Exclude
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    private List<Player> players;

}
