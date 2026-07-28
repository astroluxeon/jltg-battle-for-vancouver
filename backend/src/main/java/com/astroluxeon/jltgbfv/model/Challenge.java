package com.astroluxeon.jltgbfv.model;

import java.util.Objects;

public class Challenge {
    private int id;
    private String description;
    private Status status;

    public Challenge() {}

    public Challenge(int id, String description) {
        this.id = id;
        this.description = description;
        this.status = Status.INACTIVE;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Challenge c = (Challenge) o;
        return id == c.id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
