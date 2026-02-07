/**
 * INPUT STATE
 * ============
 *
 * Shared mutable state for player input. Read by Phaser in update(),
 * written by React mobile controls or Phaser keyboard handlers.
 *
 * This keeps the React/Phaser boundary clean:
 * - React touches write to this object
 * - Phaser reads from it each frame
 */

export interface InputState {
    left: boolean;
    right: boolean;
    jump: boolean;
}

export function createInputState(): InputState {
    return { left: false, right: false, jump: false };
}
