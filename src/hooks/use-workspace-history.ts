"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Session history is intentionally unbounded so Undo can return to the first
 * checkpoint created after a document is loaded. The legacy second argument is
 * accepted for source compatibility but no longer truncates history.
 */
export function useWorkspaceHistory<T>(
  clone: (value: T) => T,
  legacyLimit?: number,
) {
  void legacyLimit;
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [availability, setAvailability] = useState({ canUndo: false, canRedo: false });

  const refresh = useCallback(() => {
    setAvailability({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
  }, []);

  const checkpoint = useCallback((current: T) => {
    pastRef.current.push(clone(current));
    futureRef.current = [];
    refresh();
  }, [clone, refresh]);

  const undo = useCallback((current: T, apply: (value: T) => void) => {
    const previous = pastRef.current.pop();
    if (!previous) return false;
    futureRef.current.push(clone(current));
    apply(clone(previous));
    refresh();
    return true;
  }, [clone, refresh]);

  const redo = useCallback((current: T, apply: (value: T) => void) => {
    const next = futureRef.current.pop();
    if (!next) return false;
    pastRef.current.push(clone(current));
    apply(clone(next));
    refresh();
    return true;
  }, [clone, refresh]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    refresh();
  }, [refresh]);

  return {
    checkpoint,
    undo,
    redo,
    reset,
    ...availability,
  };
}
