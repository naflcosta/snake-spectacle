import { describe, expect, it } from "vitest";
import { changeDirection, initialState, step } from "@/lib/snake-engine";
import { GRID_W } from "@/services/types";

describe("snake engine", () => {
  it("starts alive with a 3-segment snake and zero score", () => {
    const s = initialState("walls");
    expect(s.snake).toHaveLength(3);
    expect(s.alive).toBe(true);
    expect(s.score).toBe(0);
    expect(s.direction).toBe("right");
  });

  it("moves the head by one cell per step", () => {
    const s = initialState("walls");
    const next = step(s);
    expect(next.snake[0].x).toBe(s.snake[0].x + 1);
    expect(next.snake[0].y).toBe(s.snake[0].y);
    expect(next.snake).toHaveLength(s.snake.length);
  });

  it("rejects a 180-degree reversal", () => {
    const s = initialState("walls"); // moving right
    const turned = changeDirection(s, "left");
    expect(turned.direction).toBe("right");
  });

  it("kills snake on wall collision in walls mode", () => {
    let s = initialState("walls");
    for (let i = 0; i < GRID_W; i++) s = step(s);
    expect(s.alive).toBe(false);
  });

  it("wraps around in pass-through mode", () => {
    let s = initialState("wrap");
    for (let i = 0; i < GRID_W; i++) s = step(s);
    expect(s.alive).toBe(true);
    expect(s.snake[0].x).toBeLessThan(GRID_W);
  });

  it("grows and increases score when eating food", () => {
    let s = initialState("walls");
    // Place food in front of head
    s = { ...s, food: { x: s.snake[0].x + 1, y: s.snake[0].y } };
    const before = s.snake.length;
    s = step(s);
    expect(s.score).toBe(1);
    expect(s.snake.length).toBe(before + 1);
  });
});
