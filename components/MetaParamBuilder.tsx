"use client";

import { useEffect } from "react";
import { captureFbclidFromUrl } from "@/hooks/useMetaParams";

export default function MetaParamBuilder() {
  useEffect(() => {
    captureFbclidFromUrl();
  }, []);

  return null;
}
