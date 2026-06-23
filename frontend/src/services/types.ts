// Shared types for the Snake app
export type GameMode = "walls" | "wrap";
export type Direction = "up" | "down" | "left" | "right";
export type Point = { x: number; y: number };

export const GRID_W = 24;
export const GRID_H = 24;

export interface GameState {
  snake: Point[]; // head first
  food: Point;
  direction: Direction;
  mode: GameMode;
  score: number;
  alive: boolean;
  tick: number;
}

export interface User {
  id: string;
  username: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  username: string;
  mode: GameMode;
  score: number;
  createdAt: number;
}

export interface ActiveGame {
  userId: string;
  username: string;
  mode: GameMode;
  state: GameState;
  updatedAt: number;
}
