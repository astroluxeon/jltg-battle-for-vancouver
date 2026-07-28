package com.astroluxeon.jltgbfv.service;

import com.astroluxeon.jltgbfv.model.*;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.*;


@Service
public class GameService {
    private final int ACTIVE_DECK_SIZE = 3;
    private final String DATA_FILE = "game-data.json";
    private final String DEFAULT_FILE = "game-default.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, Region> regions;
    private List<Challenge> challenges;
    private List<Challenge> battles;
    private Stack<Pair<Integer, Integer>> challengeHistory;

    public GameService() {
        loadFromFile();
    }

    public List<Challenge> getChallenges() {
        return challenges;
    }

    public List<Challenge> getBattles() {
        return battles;
    }

    public Collection<Region> getRegions() {
        return regions.values();
    }

    private Challenge drawCard(List<Challenge> deck) {
        List<Challenge> cards = new ArrayList<>();

        for (Challenge c : deck) {
            if (c.getStatus() == Status.INACTIVE) {
                cards.add(c);
            }
        }

        if (!cards.isEmpty()) {
            Collections.shuffle(cards);
            Challenge c = cards.get(0);
            c.setStatus(Status.ACTIVE);
            return c;
        }

        return null;
    }

    public void completeChallenge(int id, String team) {
        for (Challenge c : challenges) {
            if (c.getId() == id) {
                c.setStatus(Status.COMPLETED);
                c.setTeam(Team.valueOf(team));
                break;
            }
        }

        Challenge c = drawCard(challenges);
        int id2 = c != null ? c.getId() : -1;
        challengeHistory.push(new Pair<>(id, id2));
        saveToFile();
    }

    public Challenge startBattle() {
        Challenge c = drawCard(battles);
        saveToFile();
        return c;
    }

    public void completeBattle(int id, String team) {
        try {
            battles.get(id).setStatus(Status.COMPLETED);
            battles.get(id).setTeam(Team.valueOf(team));
            saveToFile();
        } catch (Exception e) {
            System.out.println(team + " is not a valid team.");
        }
    }

    public void claimRegion(String id, String team) {
        if (regions.get(id) != null) {
            try {
                regions.get(id).setTeam(Team.valueOf(team));
                saveToFile();
                System.out.println(regions.get(id).getName() + " claimed by " + team);
            } catch (Exception e) {
                System.out.println(team + " is not a valid team.");
            }
        }
    }

    public void lockRegion(String id, boolean lock) {
        if (regions.get(id) != null) {
            regions.get(id).setLocked(lock);
            saveToFile();
            if (lock) {
                System.out.println(regions.get(id).getName() + " locked by " + regions.get(id).getTeam());
            }
        }
    }

    public void undoChallenge() {
        if (challengeHistory.isEmpty()) {
            return;
        }

        Pair<Integer, Integer> top = challengeHistory.pop();
        int id1 = top.key();
        int id2 = top.value();

        for (Challenge challenge : challenges) {
            if (challenge.getId() == id1) {
                challenge.setStatus(Status.ACTIVE);
                challenge.setTeam(Team.NONE);
                break;
            }
        }

        if (id2 != -1) {
            for (Challenge challenge : challenges) {
                if (challenge.getId() == id2) {
                    challenge.setStatus(Status.INACTIVE);
                    break;
                }
            }
        }

        saveToFile();
    }

    public void undoBattle(int id) {
        for (Challenge c : battles) {
            if (c.getId() == id) {
                if (c.getStatus() == Status.COMPLETED) {
                    c.setStatus(Status.ACTIVE);
                    c.setTeam(Team.NONE);
                } else if (c.getStatus() == Status.ACTIVE) {
                    c.setStatus(Status.INACTIVE);
                    c.setTeam(Team.NONE);
                }
                saveToFile();
                break;
            }
        }
    }

    public void initializeNewGame() {
//        File file = new File(DEFAULT_FILE);
//        if (file.exists()) {
//            try {
//                GameState state = objectMapper.readValue(file, GameState.class);
//                this.regions = state.getRegions();
//                this.challenges = state.getChallenges();
//                this.battles = state.getBattles();
//                this.challengeHistory = state.getChallengeHistory();
//                System.out.println("Initialized new game.");
//            } catch (IOException e) {
//                System.out.println("Error initializing game: " + e.getMessage());
//            }
//        } else {
//            System.out.println("No data found.");
//        }

        this.regions = new HashMap<>();
        this.challenges = new ArrayList<>();
        this.battles = new ArrayList<>();
        this.challengeHistory = new Stack<>();

        regions.put("arbutus", new Region("arbutus", "Arbutus Ridge"));
        regions.put("grandview", new Region("grandview", "Grandview-Woodland"));
        regions.put("killarney", new Region("killarney", "Killarney"));
        regions.put("strathcona", new Region("strathcona", "Strathcona"));
        regions.put("sunset", new Region("sunset", "Sunset"));
        regions.put("hastings", new Region("hastings", "Hastings-Sunrise"));
        regions.put("kerrisdale", new Region("kerrisdale", "Kerrisdale"));
        regions.put("south-cambie", new Region("south-cambie", "South Cambie"));
        regions.put("riley-park", new Region("riley-park", "Riley Park"));
        regions.put("shaughnessy", new Region("shaughnessy", "Shaughnessy"));
        regions.put("fraserview", new Region("fraserview", "Victoria-Fraserview"));
        regions.put("west-point-grey", new Region("west-point-grey", "West Point Grey"));
        regions.put("mount-pleasant", new Region("mount-pleasant", "Mount Pleasant"));
        regions.put("collingwood", new Region("collingwood", "Renfrew-Collingwood"));
        regions.put("west-end", new Region("west-end", "West End"));
        regions.put("downtown", new Region("downtown", "Downtown"));
        regions.put("marpole", new Region("marpole", "Marpole"));
        regions.put("oakridge", new Region("oakridge", "Oakridge"));
        regions.put("dunbar", new Region("dunbar", "Dunbar-Southlands"));
        regions.put("fairview", new Region("fairview", "Fairview"));
        regions.put("kensington", new Region("kensington", "Kensington-Cedar Cottage"));
        regions.put("kitsilano", new Region("kitsilano", "Kitsilano"));

        challenges.add(new ClaimChallenge(0, "Challenge 1", "Challenge 1"));
        challenges.add(new ClaimChallenge(1, "Challenge 2", "Challenge 2"));
        challenges.add(new ClaimChallenge(2, "Challenge 3", "Challenge 3"));
        challenges.add(new ClaimChallenge(3, "Challenge 4", "Challenge 4"));
        challenges.add(new ClaimChallenge(4, "Challenge 5", "Challenge 5"));

        battles.add(new BattleChallenge(0, "Battle 1", "Battle 1"));
        battles.add(new BattleChallenge(1, "Battle 2", "Battle 2"));
        battles.add(new BattleChallenge(2, "Battle 3", "Battle 3"));

        Collections.shuffle(challenges);
        Collections.shuffle(battles);

        for (int i = 0; i < ACTIVE_DECK_SIZE; i++) {
            challenges.get(i).setStatus(Status.ACTIVE);
        }

        System.out.println("Initialized new game.");
        saveToFile();
    }

    private void loadFromFile() {
        File file = new File(DATA_FILE);
        if (file.exists()) {
            try {
                GameState state = objectMapper.readValue(file, GameState.class);
                this.regions = state.getRegions();
                this.challenges = state.getChallenges();
                this.battles = state.getBattles();
                this.challengeHistory = state.getChallengeHistory() != null ? state.getChallengeHistory() : new Stack<>();
                System.out.println("Loaded data from file.");
            } catch (IOException e) {
                System.out.println("Error reading file: " + e.getMessage());
                initializeNewGame();
            }
        } else {
            System.out.println("No save file found.");
            initializeNewGame();
        }
    }

    private void saveToFile() {
        try {
            GameState state = new GameState(this.regions, this.challenges, this.battles, this.challengeHistory);
            objectMapper.writeValue(new File(DATA_FILE), state);
        } catch (IOException e) {
            System.out.println("Error saving file: " + e.getMessage());
        }
    }
}
