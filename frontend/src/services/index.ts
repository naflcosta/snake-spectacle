// Single entry point: swap MockGameService for a real backend impl here.
import type { GameService } from "@/services/GameService";
import { MockGameService } from "@/services/MockGameService";

let instance: GameService | null = null;

export function getGameService(): GameService {
  if (!instance) instance = new MockGameService();
  return instance;
}

// Test helper — reset between tests.
export function __setGameService(svc: GameService | null) {
  instance = svc;
}

export type { GameService } from "@/services/GameService";
export * from "@/services/types";
