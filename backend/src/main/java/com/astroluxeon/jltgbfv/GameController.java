package com.astroluxeon.jltgbfv;

import com.astroluxeon.jltgbfv.model.Region;
import com.astroluxeon.jltgbfv.service.GameService;
import com.astroluxeon.jltgbfv.model.Challenge;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/status")
    public String status() {
        return "Backend is running";
    }

    @GetMapping("/challenges")
    public List<Challenge> getChallenges() {
        return gameService.getActiveChallenges();
    }

    @GetMapping("/regions")
    public Collection<Region> getRegions() {
        return gameService.getRegions();
    }

    @PostMapping("/challenges/{id}")
    public void completeChallenge(@PathVariable int id) {
        gameService.completeChallenge(id);
    }

    @PostMapping("/regions/{id}/claim")
    public void claimRegion(@PathVariable String id, @RequestParam String team) {
        gameService.claimRegion(id, team.toUpperCase());
    }

    @PostMapping("/regions/{id}/lock")
    public void lockRegion(@PathVariable String id, @RequestParam boolean lock) {
        gameService.lockRegion(id, lock);
    }
}
