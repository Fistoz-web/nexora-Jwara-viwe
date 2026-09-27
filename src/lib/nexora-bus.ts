// Small client-side bridge that lets any page talk to the Nexora assistant
// and hand content between modules (Research → Email, Meetings → Tasks, …).
import { useEffect, useState } from "react";

export type AskDetail = { prompt: string; send?: boolean };

export function askNexora(prompt: string, opts: { send?: boolean } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AskDetail>("nexora:ask", { detail: { prompt, send: opts.send } }));
}

export function openNexoraConversation(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<{ id: string }>("nexora:open-conversation", { detail: { id } }));
}

export type HandoffTarget = "email" | "tasks" | "meetings";
export type Handoff = { text: string; source: string; title?: string };

export function setHandoff(target: HandoffTarget, h: Handoff) {
  sessionStorage.setItem(`nexora:handoff:${target}`, JSON.stringify(h));
}

export function takeHandoff(target: HandoffTarget): Handoff | null {
  const raw = sessionStorage.getItem(`nexora:handoff:${target}`);
  if (!raw) return null;
  sessionStorage.removeItem(`nexora:handoff:${target}`);
  try {
    return JSON.parse(raw) as Handoff;
  } catch {
    return null;
  }
}

/** Device-local list persisted in localStorage; hydrates after mount to avoid SSR mismatch. */
export function useLocalList<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      setItems([]);
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setItems(JSON.parse(e.newValue || "[]"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);
  const update = (fn: (prev: T[]) => T[]) => {
    setItems((prev) => {
      const next = fn(prev);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };
  return [items, update, ready] as const;
}

export function appendLocal<T>(key: string, item: T) {
  const list = JSON.parse(localStorage.getItem(key) || "[]") as T[];
  localStorage.setItem(key, JSON.stringify([item, ...list]));
}

export const STORE = {
  drafts: "nexora:drafts",
  tasks: "nexora:tasks",
  events: "nexora:events",
  meetings: "nexora:meetings",
} as const;

export type Draft = { id: string; subject: string; body: string; tone: string; audience: string; updatedAt: string };
export type Task = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  priority: "Urgent" | "High" | "Med" | "Low";
  due?: string;
  source?: string;
};
export type CalEvent = { id: string; title: string; day: number; start: number; len: number; kind: "meeting" | "focus" | "deadline" };
export type MeetingRecord = { id: string; title: string; notes: string; createdAt: string };

export const uid = () => Math.random().toString(36).slice(2, 10);
