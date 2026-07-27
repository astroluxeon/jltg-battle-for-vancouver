package com.astroluxeon.jltgbfv.model;

public class Region {
    private int id;
    private String name;
    private Team team;
    private boolean locked;

    public Region(int id, String name) {
        this.id = id;
        this.name = name;
        this.team = Team.NONE;
        this.locked = false;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
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
