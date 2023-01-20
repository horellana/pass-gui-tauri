import { useState, useEffect } from "react";
import { isEqual } from "lodash";

import { Command } from "@tauri-apps/api/shell";

import { ExecutableInfo } from "./types";
import * as commands from "./commands";

export function useWindowDimensions() {
  const getWindowDimensions = () => {
    const {
      innerWidth: width,
      innerHeight: height
    } = window;

    return {
      width, height
    };
  }

  const [dimensions, setDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getWindowDimensions());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimensions;
}

export function useEntryContent(entryName: string): [string, boolean] {
  const [content, setContent] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      const newContent = await commands.getEntry(entryName)
      setContent(newContent);
      setError(false);
    };

    fetchEntry().catch((e) => setError(true));
  }, [entryName])

  return [content, error];
}

export function usePassEntries(filter: string): any {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const newEntries = await commands.listEntries(filter)

      if (!isEqual(entries, newEntries)) {
        setEntries(newEntries);
      }
    }

    fetchEntries().catch(console.error);
  }, [filter]);

  return [entries, setEntries];
};

export function usePassPath(): string {
  const [path, setPath] = useState("");

  const cmd = new Command("get-pass-path");

  cmd.stdout.on("data", (newPath) => {
    if (newPath !== path) {
      setPath(newPath);
    }
  });

  cmd.on("error", (error) => setPath(error));
  cmd.spawn().catch(setPath);

  return path;
};

export function usePassVersion(): string  {
  const [version, setVersion] = useState("");

  const cmd = new Command("get-pass-version");

  cmd.stdout.on("data", (line) => {
    if (line.includes("v")) {
      const newVersion = line
        .replaceAll("v", "")
        .replaceAll(" ","")
        .replaceAll("=", "");

      if (newVersion !== version) {
        setVersion(newVersion);
      }
    }
  });

  cmd.on("error", (error) => setVersion(error));
  cmd.spawn().catch(setVersion);

  return version;
};

export function usePassExecutableInfo(): ExecutableInfo {
  const path = usePassPath();
  const version = usePassVersion();

  return { path, version };
};
