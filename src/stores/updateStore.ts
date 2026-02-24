import { create } from "zustand";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import { getVersion } from "@tauri-apps/api/app";
import * as api from "../services/tauriApi";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "error";

interface UpdateState {
  installType: "installed" | "portable" | null;
  status: UpdateStatus;
  currentVersion: string;
  newVersion: string | null;
  releaseNotes: string | null;
  downloadProgress: number;
  dismissed: boolean;
  errorMessage: string | null;

  detectInstallType: () => Promise<void>;
  loadCurrentVersion: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  openDownloadPage: () => Promise<void>;
  dismiss: () => void;
}

const DISMISSED_VERSION_KEY = "update_dismissed_version";

export const useUpdateStore = create<UpdateState>((set, get) => ({
  installType: null,
  status: "idle",
  currentVersion: "",
  newVersion: null,
  releaseNotes: null,
  downloadProgress: 0,
  dismissed: false,
  errorMessage: null,

  detectInstallType: async () => {
    try {
      const type = await api.getInstallType();
      set({ installType: type });
    } catch {
      set({ installType: "installed" });
    }
  },

  loadCurrentVersion: async () => {
    try {
      const version = await getVersion();
      set({ currentVersion: version });
    } catch {
      // ignore
    }
  },

  checkForUpdate: async () => {
    set({ status: "checking", errorMessage: null });
    try {
      const update: Update | null = await check();
      if (update) {
        const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
        const isDismissed = dismissedVersion === update.version;
        set({
          status: "available",
          newVersion: update.version,
          releaseNotes: update.body ?? null,
          dismissed: isDismissed,
        });
      } else {
        set({ status: "idle" });
      }
    } catch (e) {
      console.warn("Update check failed:", e);
      set({ status: "error", errorMessage: String(e) });
    }
  },

  downloadAndInstall: async () => {
    set({ status: "downloading", downloadProgress: 0 });
    try {
      const update = await check();
      if (!update) return;

      let totalLength = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (totalLength > 0) {
              set({ downloadProgress: Math.round((downloaded / totalLength) * 100) });
            }
            break;
          case "Finished":
            set({ status: "installing", downloadProgress: 100 });
            break;
        }
      });

      await relaunch();
    } catch (e) {
      console.error("Update install failed:", e);
      set({ status: "error", errorMessage: String(e) });
    }
  },

  openDownloadPage: async () => {
    const { newVersion } = get();
    const tag = newVersion ? `v${newVersion}` : "latest";
    await open(
      `https://github.com/zuoliangyu/AI-Session-Viewer/releases/tag/${tag}`
    );
  },

  dismiss: () => {
    const { newVersion } = get();
    if (newVersion) {
      localStorage.setItem(DISMISSED_VERSION_KEY, newVersion);
    }
    set({ dismissed: true });
  },
}));
