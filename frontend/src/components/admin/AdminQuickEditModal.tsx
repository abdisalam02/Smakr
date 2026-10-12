"use client";

import React from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { QuickEditCardDrawer } from "./QuickEditCardDrawer";

export function AdminQuickEditModal() {
  const quickEditPost = useCityPulseStore((state) => state.quickEditPost);
  const setQuickEditPost = useCityPulseStore((state) => state.setQuickEditPost);

  if (!quickEditPost) return null;

  return (
    <QuickEditCardDrawer
      post={quickEditPost}
      onClose={() => setQuickEditPost(null)}
    />
  );
}
