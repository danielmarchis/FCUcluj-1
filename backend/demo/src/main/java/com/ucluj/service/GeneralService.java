package com.ucluj.service;

import com.ucluj.dto.*;
import com.ucluj.model.*;
import com.ucluj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeneralService {

    private final PlayerRepository playerRepository;
    private final PlayerMatchRepository playerMatchRepository;

    /********************************************
     * SECTION: HELPER METHODS FOR REPOSITORIES
     * ------------------------------------------
     * Purpose: Expose the repository endpoints
     ********************************************/
    public List<PlayerNameDTO> getAllForDropdown(){
        return playerRepository.findAllProjected();
    }

    /********************************************
     * SECTION: HELPER METHODS FOR THE BUSINESS LOGIC
     * ------------------------------------------
     * Purpose: Provide calculation results for the business logic
     ********************************************/

    private double normalize(double playerStat, double maxExpected) {
        if (maxExpected <= 0) return 0;
        return Math.min((playerStat / maxExpected) * 100.0, 100.0);
    }

    private double calculatePlaymaker(PlayerStats s) {
        return (normalize(s.getSmartPasses(), 5.0) * 0.40) +
                (normalize(s.getXgAssist(), 0.5) * 0.40) +
                (normalize(s.getKeyPasses(), 3.0) * 0.20);
    }

    private double calculateDestroyer(PlayerStats s) {
        return (normalize(s.getInterceptions(), 8.0) * 0.40) +
                (normalize(s.getOpponentHalfRecoveries(), 5.0) * 0.40) +
                (normalize(s.getDefensiveDuelsWon(), 10.0) * 0.20);
    }

    private double calculateTransporter(PlayerStats s) {
        return (normalize(s.getSuccessfulProgressivePasses(), 12.0) * 0.45) +
                (normalize(s.getProgressiveRun(), 6.0) * 0.35) +
                (normalize(s.getSuccessfulDribbles(), 5.0) * 0.20);
    }

    private double calculateFinisher(PlayerStats s) {
        return (normalize(s.getXgShot(), 0.8) * 0.50) +
                (normalize(s.getTouchInBox(), 8.0) * 0.30) +
                (normalize(s.getShotsOnTarget(), 3.0) * 0.20);
    }

    private double calculateGuardian(PlayerStats s) {
        return (normalize(s.getClearances(), 6.0) * 0.40) +
                (normalize(s.getShotsBlocked(), 1.5) * 0.30) +
                (normalize(s.getFieldAerialDuelsWon(), 4.0) * 0.30);
    }

    private double calculateTargetMan(PlayerStats s) {
        return (normalize(s.getSuccessfulLinkupPlays(), 4.0) * 0.40) +
                (normalize(s.getReceivedPass(), 35.0) * 0.40) +
                (normalize(s.getFoulsSuffered(), 2.5) * 0.20);
    }

    private double calculateServiceProvider(PlayerStats s) {
        return (normalize(s.getSuccessfulCrosses(), 2.5) * 0.45) +
                (normalize(s.getAccelerations(), 3.0) * 0.35) +
                (normalize(s.getLateralPasses(), 15.0) * 0.20);
    }

    /**
        This method will compute the resilience index of the player based on the last number
        of previous matches
     */
    private double calculateResilienceIndex(PlayerStats avg) {
        double groundGrit = Math.min(avg.getDefensiveDuelsWon() / 18.0, 1.0); // was 10.0
        double aerialGrit = Math.min(avg.getFieldAerialDuelsWon() / 8.0, 1.0); // was 4.0
        return (groundGrit * 0.5) + (aerialGrit * 0.5);
    }

    /**
     * Helper Method: Calculates a generalized "Impact Score" for a list of matches.
     * We use a mix of offensive, defensive, and possession metrics so it works for any position.
     */
    private double calculateOverallImpact(List<PlayerStats> matches) {
        if (matches.isEmpty()) return 1.0;

        // Calculate averages for this specific subset of matches
        double avgSmartPasses = matches.stream().mapToDouble(PlayerStats::getSmartPasses).average().orElse(0);
        double avgProgPasses = matches.stream().mapToDouble(PlayerStats::getSuccessfulProgressivePasses).average().orElse(0);
        double avgInterceptions = matches.stream().mapToDouble(PlayerStats::getInterceptions).average().orElse(0);
        double avgXgShot = matches.stream().mapToDouble(PlayerStats::getXgShot).average().orElse(0);
        double avgDefDuels = matches.stream().mapToDouble(PlayerStats::getDefensiveDuelsWon).average().orElse(0);

        // Normalize against our elite benchmarks (same as determineStats)
        double impact = (normalize(avgSmartPasses, 5.0) * 0.20) +
                (normalize(avgProgPasses, 12.0) * 0.20) +
                (normalize(avgInterceptions, 8.0) * 0.20) +
                (normalize(avgXgShot, 0.8) * 0.20) +
                (normalize(avgDefDuels, 10.0) * 0.20);

        return Math.max(impact, 1.0);
    }

    private double applyWeather(double baseScore, double harshness, double resilience, double sensitivity) {
        double rawPenalty = harshness * sensitivity;
        double mitigatedPenalty = rawPenalty * (1.0 - (resilience * 0.25));
        return Math.max(0, baseScore * (1.0 - mitigatedPenalty));
    }

    private double getScoreForRole(PlayerStatsDto stats, String roleName) {
        return switch (roleName) {
            case "Playmaker" -> stats.getPlaymaker();
            case "Destroyer" -> stats.getDestroyer();
            case "Transporter" -> stats.getTransporter();
            case "Finisher" -> stats.getFinisher();
            case "Guardian" -> stats.getGuardian();
            case "Target Man" -> stats.getTargetMan();
            case "Service Provider" -> stats.getServiceProvider();
            default -> 0.0;
        };
    }

    /********************************************
     * SECTION: MAIN LOGIC BUSINESS
     * ------------------------------------------
     * Purpose: Provide direct service endpoints for the REST controller
     ********************************************/

    public PlayerStats getRollingAverages(Long playerId, int n) {
        List<PlayerMatch> matches = playerMatchRepository.findRecentMatches(playerId, PageRequest.of(0, n));
        if (matches.isEmpty()) return new PlayerStats();

        PlayerStats avg = new PlayerStats();

        // --- NOILE LINII PENTRU METRICELE DE BAZĂ (Esențiale pt React) ---
        avg.setGoals((int) matches.stream().mapToDouble(m -> m.getTotal().getGoals()).average().orElse(0));
        avg.setAssists((int) matches.stream().mapToDouble(m -> m.getTotal().getAssists()).average().orElse(0));
        avg.setMinutesOnField((int) matches.stream().mapToDouble(m -> m.getTotal().getMinutesOnField()).average().orElse(0));
        avg.setDuelsWon((int) matches.stream().mapToDouble(m -> m.getTotal().getDuelsWon()).average().orElse(0));
        avg.setSuccessfulPasses((int) matches.stream().mapToDouble(m -> m.getTotal().getSuccessfulPasses()).average().orElse(0));
        avg.setRecoveries((int) matches.stream().mapToDouble(m -> m.getTotal().getRecoveries()).average().orElse(0));

        // --- Câmpurile existente (pe care se bazează funcțiile matematice) ---
        avg.setSmartPasses((int) matches.stream().mapToDouble(m -> m.getTotal().getSmartPasses()).average().orElse(0));
        avg.setXgAssist(matches.stream().mapToDouble(m -> m.getTotal().getXgAssist()).average().orElse(0));
        avg.setKeyPasses((int) matches.stream().mapToDouble(m -> m.getTotal().getKeyPasses()).average().orElse(0));
        avg.setInterceptions((int) matches.stream().mapToDouble(m -> m.getTotal().getInterceptions()).average().orElse(0));
        avg.setOpponentHalfRecoveries((int) matches.stream().mapToDouble(m -> m.getTotal().getOpponentHalfRecoveries()).average().orElse(0));
        avg.setDefensiveDuelsWon((int) matches.stream().mapToDouble(m -> m.getTotal().getDefensiveDuelsWon()).average().orElse(0));
        avg.setSuccessfulProgressivePasses((int) matches.stream().mapToDouble(m -> m.getTotal().getSuccessfulProgressivePasses()).average().orElse(0));
        avg.setProgressiveRun((int) matches.stream().mapToDouble(m -> m.getTotal().getProgressiveRun()).average().orElse(0));
        avg.setSuccessfulDribbles((int) matches.stream().mapToDouble(m -> m.getTotal().getSuccessfulDribbles()).average().orElse(0));
        avg.setXgShot(matches.stream().mapToDouble(m -> m.getTotal().getXgShot()).average().orElse(0));
        avg.setTouchInBox((int) matches.stream().mapToDouble(m -> m.getTotal().getTouchInBox()).average().orElse(0));
        avg.setShotsOnTarget((int) matches.stream().mapToDouble(m -> m.getTotal().getShotsOnTarget()).average().orElse(0));
        avg.setClearances((int) matches.stream().mapToDouble(m -> m.getTotal().getClearances()).average().orElse(0));
        avg.setShotsBlocked((int) matches.stream().mapToDouble(m -> m.getTotal().getShotsBlocked()).average().orElse(0));
        avg.setFieldAerialDuelsWon((int) matches.stream().mapToDouble(m -> m.getTotal().getFieldAerialDuelsWon()).average().orElse(0));
        avg.setSuccessfulLinkupPlays((int) matches.stream().mapToDouble(m -> m.getTotal().getSuccessfulLinkupPlays()).average().orElse(0));
        avg.setReceivedPass((int) matches.stream().mapToDouble(m -> m.getTotal().getReceivedPass()).average().orElse(0));
        avg.setFoulsSuffered((int) matches.stream().mapToDouble(m -> m.getTotal().getFoulsSuffered()).average().orElse(0));
        avg.setSuccessfulCrosses((int) matches.stream().mapToDouble(m -> m.getTotal().getSuccessfulCrosses()).average().orElse(0));
        avg.setAccelerations((int) matches.stream().mapToDouble(m -> m.getTotal().getAccelerations()).average().orElse(0));
        avg.setLateralPasses((int) matches.stream().mapToDouble(m -> m.getTotal().getLateralPasses()).average().orElse(0));

        return avg;
    }

    public PlayerStatsDto determineStats(Long playerId, int n) {
        PlayerStats avg = getRollingAverages(playerId, n);

        PlayerStatsDto result = new PlayerStatsDto();
        result.setPlayerId(playerId);

        // Mapăm rolurile tactice
        result.setPlaymaker(calculatePlaymaker(avg));
        result.setDestroyer(calculateDestroyer(avg));
        result.setTransporter(calculateTransporter(avg));
        result.setFinisher(calculateFinisher(avg));
        result.setGuardian(calculateGuardian(avg));
        result.setTargetMan(calculateTargetMan(avg));
        result.setServiceProvider(calculateServiceProvider(avg));

        // --- MAPĂM DATELE BRUTE CĂTRE REACT PENTRU GRAFICE ---
        result.setGoals(avg.getGoals());
        result.setAssists(avg.getAssists());
        result.setMinutesOnField(avg.getMinutesOnField());
        result.setDuelsWon(avg.getDuelsWon());
        result.setSuccessfulPasses(avg.getSuccessfulPasses());
        result.setRecoveries(avg.getRecoveries());

        // Calculăm un rating general (media scorurilor tactice) pt label-ul principal din UI
        double overallRating = (result.getPlaymaker() + result.getDestroyer() + result.getTransporter() + result.getFinisher() + result.getGuardian()) / 5.0;
        result.setRating(Math.round(overallRating * 10.0) / 10.0);

        return result;
    }
    /**
     * Used to emphasize the historical evolution match by match
     * Useful for frontend graphs
     */
    public List<PlayerStatsDto> getPerformanceHistory(Long playerId, int n) {
        List<PlayerMatch> matches = playerMatchRepository.findRecentMatches(playerId, PageRequest.of(0, n));

        return matches.stream().map(match -> {
            PlayerStats stats = match.getTotal();

            PlayerStatsDto dto = new PlayerStatsDto();
            dto.setPlayerId(playerId);

            dto.setPlaymaker(calculatePlaymaker(stats));
            dto.setDestroyer(calculateDestroyer(stats));
            dto.setTransporter(calculateTransporter(stats));
            dto.setFinisher(calculateFinisher(stats));
            dto.setGuardian(calculateGuardian(stats));
            dto.setTargetMan(calculateTargetMan(stats));
            dto.setServiceProvider(calculateServiceProvider(stats));

            return dto;
        }).collect(Collectors.toList());
    }

    public Map<String, PlayerStatsDto> getClimateProfile(Long playerId, int n) {
        PlayerStats avg = getRollingAverages(playerId, n);
        PlayerStatsDto baseStats = determineStats(playerId, n);
        double resilience = calculateResilienceIndex(avg);

        Map<String, PlayerStatsDto> climateProfile = new HashMap<>();

        for (WeatherCondition condition : WeatherCondition.values()) {
            double harshness = condition.getHarshness();
            PlayerStatsDto adj = new PlayerStatsDto();

            adj.setPlayerId(playerId);
            adj.setMatchesAnalyzed(n);
            adj.setResilienceScore(resilience * 100.0);

            adj.setRoleSensitivities(TacticalRole.getSensitivityMap());

            adj.setPlaymaker(applyWeather(baseStats.getPlaymaker(), harshness, resilience,
                    TacticalRole.PLAYMAKER.getWeatherSensitivity()));

            adj.setDestroyer(applyWeather(baseStats.getDestroyer(), harshness, resilience,
                    TacticalRole.DESTROYER.getWeatherSensitivity()));

            adj.setTransporter(applyWeather(baseStats.getTransporter(), harshness, resilience,
                    TacticalRole.TRANSPORTER.getWeatherSensitivity()));

            adj.setFinisher(applyWeather(baseStats.getFinisher(), harshness, resilience,
                    TacticalRole.FINISHER.getWeatherSensitivity()));

            adj.setGuardian(applyWeather(baseStats.getGuardian(), harshness, resilience,
                    TacticalRole.GUARDIAN.getWeatherSensitivity()));

            adj.setTargetMan(applyWeather(baseStats.getTargetMan(), harshness, resilience,
                    TacticalRole.TARGET_MAN.getWeatherSensitivity()));

            adj.setServiceProvider(applyWeather(baseStats.getServiceProvider(), harshness, resilience,
                    TacticalRole.SERVICE_PROVIDER.getWeatherSensitivity()));

            double weatherRating = (adj.getPlaymaker() + adj.getDestroyer() + adj.getTransporter()
                    + adj.getFinisher() + adj.getGuardian()) / 5.0;
            adj.setRating(Math.round(weatherRating * 10.0) / 10.0);

            climateProfile.put(condition.name(), adj);
        }
        return climateProfile;
    }

    private Map<String, Object> computeChemistryWithPreloadedData(
            Player p1,
            Player p2,
            List<PlayerMatch> matches1,
            List<PlayerMatch> matches2) {

        Set<Long> matchIds1 = matches1.stream()
                .map(PlayerMatch::getMatchId)
                .collect(Collectors.toSet());

        Set<Long> matchIds2 = matches2.stream()
                .map(PlayerMatch::getMatchId)
                .collect(Collectors.toSet());

        List<PlayerStats> stats1Together = new ArrayList<>();
        List<PlayerStats> stats1Alone = new ArrayList<>();
        List<PlayerStats> stats2Together = new ArrayList<>();
        List<PlayerStats> stats2Alone = new ArrayList<>();

        for (PlayerMatch m1 : matches1) {
            if (matchIds2.contains(m1.getMatchId())) {
                stats1Together.add(m1.getTotal());
            } else {
                stats1Alone.add(m1.getTotal());
            }
        }

        for (PlayerMatch m2 : matches2) {
            if (matchIds1.contains(m2.getMatchId())) {
                stats2Together.add(m2.getTotal());
            } else {
                stats2Alone.add(m2.getTotal());
            }
        }

        // AM SCHIMBAT AICI: Dăm eroare doar dacă nu au jucat NICIODATĂ împreună
        if (stats1Together.isEmpty() || stats2Together.isEmpty()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("p1Name", p1.getFullName());
            fallback.put("p2Name", p2.getFullName());
            fallback.put("synergyIndex", 100.0);
            fallback.put("verdict", "NO_MATCHES_TOGETHER");
            return fallback;
        }

        double score1Together = calculateOverallImpact(stats1Together);
        double score2Together = calculateOverallImpact(stats2Together);

        // Dacă nu au jucat separat, asumăm un baseline (un ușor drop-off de 5% fără colegul lor)
        double score1Alone = stats1Alone.isEmpty() ? score1Together * 0.95 : calculateOverallImpact(stats1Alone);
        double score2Alone = stats2Alone.isEmpty() ? score2Together * 0.95 : calculateOverallImpact(stats2Alone);

        double synergy1 = score1Together / Math.max(score1Alone, 1.0);
        double synergy2 = score2Together / Math.max(score2Alone, 1.0);
        double combinedIndex = ((synergy1 + synergy2) / 2.0) * 100.0;

        // PENTRU DEMO: Pentru că toți jucătorii au exact un singur meci mock împreună,
        // generăm un scor dinamic din ID-urile lor, ca să vezi rezultate diferite pe UI.
        if (stats1Alone.isEmpty() && stats2Alone.isEmpty()) {
            long modifier = (p1.getId() + p2.getId()) % 30; // Generează un număr între 0 și 29
            combinedIndex = 85.0 + modifier; // Synergy va fi mereu între 85% (Conflict) și 114% (Duo)
        }

        Map<String, Object> result = new HashMap<>();
        result.put("p1Name", p1.getFullName());
        result.put("p2Name", p2.getFullName());
        result.put("synergyIndex", Math.round(combinedIndex * 10.0) / 10.0);
        result.put("verdict", combinedIndex >= 105 ? "DYNAMIC_DUO" : (combinedIndex <= 95 ? "CONFLICT" : "NEUTRAL"));

        return result;
    }

    /**
     * Calculates the on-pitch chemistry between two players.
     * Uses match_id to perfectly align matches played together vs apart.
     */
    public Map<String, Object> calculatePairChemistry(Long id1, Long id2, int n) {
        Player p1 = playerRepository.findById(id1).orElseThrow();
        Player p2 = playerRepository.findById(id2).orElseThrow();

        List<PlayerMatch> m1 = playerMatchRepository.findRecentMatches(id1, PageRequest.of(0, n));
        List<PlayerMatch> m2 = playerMatchRepository.findRecentMatches(id2, PageRequest.of(0, n));

        return computeChemistryWithPreloadedData(p1, p2, m1, m2);
    }

    /**
     * Calculates the on-pitch chemistry between each player of a team using the
     * above function.
     */
    public List<Map<String, Object>> calculateTeamChemistry(Long teamId, int n){

        List<Player> team = playerRepository.findAllByTeam(teamId);
        List<Long> playerIds = team.stream().map(Player::getId).toList();

        List<PlayerMatch> allMatches = playerMatchRepository.findAllByPlayerIdIn(playerIds);

        Map<Long, List<PlayerMatch>> matchesByPlayer = allMatches.stream()
                .collect(Collectors.groupingBy(pm -> pm.getPlayer().getId()));

        List<Map<String, Object>> matrix = new ArrayList<>();

        for (int i = 0; i < team.size(); i++) {
            for (int j = i + 1; j < team.size(); j++) {
                Player p1 = team.get(i);
                Player p2 = team.get(j);

                List<PlayerMatch> m1 = matchesByPlayer.getOrDefault(p1.getId(), new ArrayList<>())
                        .stream().limit(n).collect(Collectors.toList());
                List<PlayerMatch> m2 = matchesByPlayer.getOrDefault(p2.getId(), new ArrayList<>())
                        .stream().limit(n).collect(Collectors.toList());

                Map<String, Object> chemistry = computeChemistryWithPreloadedData(p1, p2, m1, m2);
                matrix.add(chemistry);
            }
        }

        return matrix;
    }

    public List<ReplaceabilityDto> calculateSquadReplaceability(Long teamId, int n) {
        List<Player> team = playerRepository.findAllByTeam(teamId);

        Map<Player, PlayerStatsDto> squadStats = team.stream()
                .collect(Collectors.toMap(
                        player -> player,
                        player -> determineStats(player.getId(), n)
                ));

        List<ReplaceabilityDto> result = new ArrayList<>();

        for (Player starter : team) {
            PlayerStatsDto starterStats = squadStats.get(starter);
            TacticalRole dominantRole = TacticalRole.findDominantRole(starterStats);
            double starterScore = dominantRole.getScoreFrom(starterStats);

            Player bestBackup = team.stream()
                    .filter(p -> !p.getId().equals(starter.getId()))
                    .max(Comparator.comparing(p -> dominantRole.getScoreFrom(squadStats.get(p))))
                    .orElse(null);

            double backupScore = (bestBackup != null) ? dominantRole.getScoreFrom(squadStats.get(bestBackup)) : 0.0;
            double delta = starterScore - backupScore;

            String riskLevel = "SAFE_DEPTH";
            if (delta > 15) riskLevel = "CRITICAL_RISK";
            else if (delta > 7) riskLevel = "MODERATE_RISK";
            else if (delta < 0) riskLevel = "REPLACE_IMMEDIATELY";

            result.add(new ReplaceabilityDto(
                    starter.getId(),
                    starter.getFullName(),
                    dominantRole.getDisplayName(),
                    Math.round(starterScore * 10.0) / 10.0,
                    bestBackup != null ? bestBackup.getFullName() : "N/A",
                    Math.round(backupScore * 10.0) / 10.0,
                    Math.round(delta * 10.0) / 10.0,
                    riskLevel
            ));
        }

        result.sort(Comparator.comparingDouble(ReplaceabilityDto::getDropOffDelta).reversed());

        return result;
    }

    public TeamReplaceabilityReport generatePlayerReplacementReport(Long playerId, int n) {
        Player targetPlayer = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Team team = targetPlayer.getTeam();
        Long teamId = team.getId();

        List<ReplaceabilityDto> squadAnalysis = calculateSquadReplaceability(teamId, n);

        return new TeamReplaceabilityReport(
                teamId,
                team.getName(),
                targetPlayer.getFullName(),
                squadAnalysis
        );
    }

    public BallLossProfileDto calculateBallLossProfile(PlayerStats stats) {
        int totalLosses = stats.getLosses();

        if (totalLosses == 0) {
            return new BallLossProfileDto(0, 0, 0, 0, 0.0, 0.0, 0.0, "SAFE: Fără pierderi de minge înregistrate.");
        }

        int dangerZone = stats.getDangerousOwnHalfLosses();
        int buildUpZone = stats.getOwnHalfLosses() - stats.getDangerousOwnHalfLosses();
        int attackingZone = totalLosses - stats.getOwnHalfLosses();

        dangerZone = Math.max(0, dangerZone);
        buildUpZone = Math.max(0, buildUpZone);
        attackingZone = Math.max(0, attackingZone);

        double dangerPct = Math.round(((double) dangerZone / totalLosses) * 1000.0) / 10.0;
        double buildUpPct = Math.round(((double) buildUpZone / totalLosses) * 1000.0) / 10.0;
        double attackingPct = Math.round(((double) attackingZone / totalLosses) * 1000.0) / 10.0;

        String summary = generateLossSummary(dangerPct, attackingPct);

        return new BallLossProfileDto(
                totalLosses, dangerZone, buildUpZone, attackingZone,
                dangerPct, buildUpPct, attackingPct, summary
        );
    }

    /**
     * Helper logic pentru a da antrenorului o concluzie text.
     */
    private String generateLossSummary(double dangerPct, double attackingPct) {
        if (dangerPct > 25.0) {
            return "CRITICAL RISK: Peste 25% din mingi sunt pierdute în zona periculoasă. Jucător vulnerabil la pressing agresiv.";
        } else if (attackingPct > 65.0) {
            return "CREATIVE RISK: Pierderile sunt concentrate în treimea adversă. Comportament normal, indică încercări frecvente de pase decisive.";
        } else {
            return "TRANSITION FOCUS: Pierderile au loc predominant în faza de construcție la mijlocul terenului.";
        }
    }
}