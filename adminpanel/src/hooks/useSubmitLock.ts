import { useCallback, useRef, useState } from "react";

export function useSubmitLock() {
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);

  const run = useCallback(async (fn: () => Promise<void>) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setSubmitting(true);
    try {
      await fn();
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submitting, run };
}
