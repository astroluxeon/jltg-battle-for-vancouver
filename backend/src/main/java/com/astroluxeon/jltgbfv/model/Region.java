package com.astroluxeon.jltgbfv.model;

public class Region {
    private String id;
    private String name;
    private Team team;
    private boolean locked;

    public Region() {}

    public Region(String id, String name) {
        this.id = id;
        this.name = name;
        this.team = Team.NONE;
        this.locked = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }
}
