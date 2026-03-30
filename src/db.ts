import Dexie, { type Table } from "dexie";

export interface Sighting {
  videoId: string;
  seenAt: Date;
  sessionId: string;
}

class PacoDB extends Dexie {
  sightings!: Table<Sighting, [string, string]>;

  constructor() {
    super("PacoDB");
    this.version(1).stores({
      sightings: "[videoId+sessionId], videoId, sessionId, seenAt",
    });
  }
}

export const db = new PacoDB();

function isConstraintError(error: unknown): boolean {
  return error instanceof Error && error.name === Dexie.errnames.Constraint;
}

export async function recordSighting(videoId: string, sessionId: string): Promise<void> {
  try {
    await db.sightings.add({ videoId, seenAt: new Date(), sessionId });
  } catch (error: unknown) {
    if (isConstraintError(error)) {
      return;
    }

    throw error;
  }
}

export async function getSightingCount(videoId: string): Promise<number> {
  return db.sightings.where("videoId").equals(videoId).count();
}
