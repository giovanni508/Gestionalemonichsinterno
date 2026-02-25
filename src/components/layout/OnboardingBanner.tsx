"use client";

import React, { useState, useEffect } from "react";

interface OnboardingBannerProps {
  pageKey: string;
  message: string;
}

export default function OnboardingBanner({
  pageKey,
  message,
}: OnboardingBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `onboarding_${pageKey}`;
    const dismissed = localStorage.getItem(key);
    if (!dismissed) {
      setVisible(true);
    }
  }, [pageKey]);

  const dismiss = () => {
    localStorage.setItem(`onboarding_${pageKey}`, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
      <p className="text-base text-gold">{message}</p>
      <button
        onClick={dismiss}
        className="text-gold hover:text-gold-light text-lg font-bold ml-4 min-w-[32px]"
        title="Chiudi"
      >
        ✕
      </button>
    </div>
  );
}
