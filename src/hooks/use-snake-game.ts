import { useCallback, useEffect, useRef, useState } from "react";
import {
  changeDirection,
  initialState,
  step,
} from "@/lib/snake-engine";
import type { Direction, GameMode, GameState } from "@/services/types";
import { getGameService } from "@/services";

const TICK_MS = 110;

export function useSnakeGame(mode: GameMode) {
  const [state, setState] = useState<GameState>(() => initialState(mode));
  const stateRef = useRef(state);
  const [running, setRunning] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const reset = useCallback(() => {
    submittedRef.current = false;
    const s = initialState(mode);
    stateRef.current = s;
    setState(s);
    setRunning(false);
    void getGameService().endGame();
  }, [mode]);

  // Reset when mode changes
  useEffect(() => {
    reset();
  }, [mode, reset]);

  // Tick loop
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState((prev) => {
        const next = step(prev);
        void getGameService().publishGame(next);
        if (!next.alive && !submittedRef.current) {
          submittedRef.current = true;
          // Only submit if logged in
          const user = getGameService().getCurrentUser();
          if (user && next.score > 0) {
            void getGameService().submitScore(next.mode, next.score);
          }
          void getGameService().endGame();
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        setState((prev) => changeDirection(prev, dir));
      }
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void getGameService().endGame();
    };
  }, []);

  return {
    state,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset,
    setDirection: (d: Direction) => setState((p) => changeDirection(p, d)),
  };
}
