"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface LessonContextValue {
  lessonId: number | null;
  minScore: number;
  courseSlug: string;
  isEnrolled: boolean;
  isAuthenticated: boolean;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({
  children,
  lessonId,
  minScore,
  courseSlug,
  isEnrolled,
}: {
  children: ReactNode;
  lessonId: number | null;
  minScore: number;
  courseSlug: string;
  isEnrolled: boolean;
}) {
  const { isAuthenticated } = useAuth();
  return (
    <LessonContext.Provider
      value={{
        lessonId,
        minScore,
        courseSlug,
        isEnrolled,
        isAuthenticated,
      }}
    >
      {children}
    </LessonContext.Provider>
  );
}

export function useLesson() {
  const ctx = useContext(LessonContext);
  if (!ctx) return null;
  return ctx;
}
