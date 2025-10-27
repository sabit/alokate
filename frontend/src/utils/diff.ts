export interface DiffResult<T> {
  added: T[];
  removed: T[];
  changed: T[];
}

export const diffArrays = <T extends { id: string }>(current: T[], next: T[]): DiffResult<T> => {
  const mapCurrent = new Map(current.map((item) => [item.id, item]));
  const mapNext = new Map(next.map((item) => [item.id, item]));

  const added: T[] = [];
  const removed: T[] = [];
  const changed: T[] = [];

  for (const [id, value] of mapNext) {
    if (!mapCurrent.has(id)) {
      added.push(value);
    } else if (JSON.stringify(mapCurrent.get(id)) !== JSON.stringify(value)) {
      changed.push(value);
    }
  }

  for (const [id, value] of mapCurrent) {
    if (!mapNext.has(id)) {
      removed.push(value);
    }
  }

  return { added, removed, changed };
};
