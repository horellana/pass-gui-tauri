import { useState, useEffect } from "react";
import { isEqual } from "lodash";

import { PassEntry } from "./types";
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

export function usePassEntries(filter: string): any {
  const initialState : PassEntry[] = [];
  const [entries, setEntries] = useState(initialState);

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
