/**
 * SCENE V1 TYPES
 * ===============
 *
 * TypeScript types derived from the Zod schema.
 * These are the canonical types used throughout the app.
 *
 * No React or Phaser imports here - these are pure data types.
 */

import { z } from 'zod';
import { SceneV1Schema } from './scene_v1.schema';

/** Full validated Scene V1 data */
export type SceneV1 = z.output<typeof SceneV1Schema>;

/** A single object in the scene */
export type SceneObject = SceneV1['objects'][number];

/** Object type enum */
export type SceneObjectType = SceneObject['type'];

/** Normalized bounding box */
export type BoundsNormalized = SceneObject['bounds_normalized'];

/** Spawn data */
export type SceneSpawns = SceneV1['spawns'];

/** Normalized point */
export type NormalizedPoint = { x: number; y: number };
