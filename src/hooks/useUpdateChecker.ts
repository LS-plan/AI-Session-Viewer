import { useEffect, useRef } from "react";
import { useUpdateStore } from "../stores/updateStore";

export function useUpdateChecker() {
  const hasChecked = useRef(false);
  const { detectInstallType, loadCurrentVersion, checkForUpdate } =
    useUpdateStore();

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    detectInstallType();
    loadCurrentVersion();

    const timer = setTimeout(() => {
      checkForUpdate();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
}
