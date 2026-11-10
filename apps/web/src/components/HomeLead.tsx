"use client";

import { pickLine, todayIso } from "@motter/core";

export function HomeLead() {
  const line = pickLine("home", todayIso());
  return <p className="lead">{line.text}</p>;
}
