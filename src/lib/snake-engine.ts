import type {
  Direction,
  GameMode,
  GameState,
  Point,
} from "@/services/types";
import { GRID_H, GRID_W } from "@/services/types";

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function randomFood(snake: Point[], rng: () => number = Math.random): Point {
  // Pick a free cell. With a 24x24 grid this is fine.
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let x = 0; x < GRID_W; x++) {
    for (let y = 0; y < GRID_H; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(rng() * free.length)];
}

export function initialState(mode: GameMode, rng: () => number = Math.random): GameState {
  const snake: Point[] = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
  ];
  return {
    snake,
    food: randomFood(snake, rng),
    direction: "right",
    mode,
    score: 0,
    alive: true,
    tick: 0,
  };
}

export function changeDirection(state: GameState, dir: Direction): GameState {
  if (dir === OPPOSITE[state.direction] || dir === state.direction) return state;
  return { ...state, direction: dir };
}

export function step(state: GameState, rng: () => number = Math.random): GameState {
  if (!state.alive) return state;
  const head = state.snake[0];
  const d = DELTA[state.direction];
  let nx = head.x + d.x;
  let ny = head.y + d.y;

  if (state.mode === "wrap") {
    nx = (nx + GRID_W) % GRID_W;
    ny = (ny + GRID_H) % GRID_H;
  } else if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) {
    return { ...state, alive: false, tick: state.tick + 1 };
  }

  const newHead: Point = { x: nx, y: ny };
  const ate = newHead.x === state.food.x && newHead.y === state.food.y;
  const body = ate ? state.snake : state.snake.slice(0, -1);

  // self collision
  if (body.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, alive: false, tick: state.tick + 1 };
  }

  const newSnake = [newHead, ...body];
  return {
    ...state,
    snake: newSnake,
    food: ate ? randomFood(newSnake, rng) : state.food,
    score: ate ? state.score + 1 : state.score,
    tick: state.tick + 1,
  };
}
