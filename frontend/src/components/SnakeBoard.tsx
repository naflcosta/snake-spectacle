import { useEffect, useRef } from "react";
import type { GameState } from "@/services/types";
import { GRID_H, GRID_W } from "@/services/types";

interface Props {
  state: GameState;
  size?: number;
}

export function SnakeBoard({ state, size = 480 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cell = size / GRID_W;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // background
    ctx.fillStyle = "oklch(0.18 0.04 265)";
    ctx.fillRect(0, 0, size, (size * GRID_H) / GRID_W);

    // grid
    ctx.strokeStyle = "oklch(0.25 0.04 265)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_W; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, GRID_H * cell);
      ctx.stroke();
    }
    for (let j = 0; j <= GRID_H; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cell);
      ctx.lineTo(GRID_W * cell, j * cell);
      ctx.stroke();
    }

    // food
    ctx.fillStyle = "oklch(0.7 0.2 25)";
    ctx.beginPath();
    ctx.arc(
      state.food.x * cell + cell / 2,
      state.food.y * cell + cell / 2,
      cell / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // snake
    state.snake.forEach((p, idx) => {
      ctx.fillStyle = idx === 0 ? "oklch(0.85 0.18 145)" : "oklch(0.7 0.16 150)";
      ctx.fillRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2);
    });

    if (!state.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.floor(size / 14)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("Game Over", size / 2, size / 2);
    }
  }, [state, size, cell]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-border shadow-lg"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
