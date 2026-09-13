"use client";

import { useEffect, useId } from "react";
import type { QuizBlockData, QuizQuestion } from "@/lib/api/blocks";

type Props = {
  data: QuizBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

const emptyQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", ""],
  correct_index: 0,
  explanation: "",
});

export default function QuizFields({ data, onChange }: Props) {
  const radioPrefix = useId();

  // Миграция: если старая схема (один вопрос) — конвертируем в новую
  useEffect(() => {
    const anyData = data as unknown as Record<string, unknown> & {
      question?: string;
      options?: string[];
      correct_index?: number;
      explanation?: string;
      questions?: QuizQuestion[];
    };
    if (anyData.question !== undefined && !anyData.questions) {
      const migrated: QuizQuestion = {
        question: anyData.question,
        options: anyData.options || ["", ""],
        correct_index: anyData.correct_index ?? 0,
        explanation: anyData.explanation || "",
      };
      const next: Record<string, unknown> = { ...anyData };
      delete next.question;
      delete next.options;
      delete next.correct_index;
      delete next.explanation;
      if (next.title === undefined) next.title = "";
      next.questions = [migrated];
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questions =
    data.questions && data.questions.length > 0
      ? data.questions
      : [emptyQuestion()];

  const setQuestions = (next: QuizQuestion[]) =>
    onChange({ ...data, questions: next });

  const updateQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    setQuestions(
      questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q))
    );

  const setOption = (qi: number, oi: number, value: string) => {
    const q = questions[qi];
    updateQuestion(qi, {
      options: (q.options || ["", ""]).map((o, idx) =>
        idx === oi ? value : o
      ),
    });
  };

  const addOption = (qi: number) => {
    const q = questions[qi];
    updateQuestion(qi, { options: [...(q.options || ["", ""]), ""] });
  };

  const removeOption = (qi: number, oi: number) => {
    const q = questions[qi];
    const opts = (q.options || ["", ""]).filter((_, idx) => idx !== oi);
    if (opts.length < 2) return;
    const correct = q.correct_index ?? 0;
    const nextCorrect =
      correct === oi ? 0 : correct > oi ? correct - 1 : correct;
    updateQuestion(qi, { options: opts, correct_index: nextCorrect });
  };

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next);
  };

  return (
    <>
      <div className="block-editor-field">
        <label>Заголовок викторины</label>
        <input
          value={data.title || ""}
          placeholder="Например: Проверь себя по Go"
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="block-editor-field">
        <label>Вопросы ({questions.length})</label>

        {questions.map((q, qi) => (
          <div key={qi} className="quiz-editor-question">
            <div className="quiz-editor-question-head">
              <span>Вопрос {qi + 1}</span>
              <div className="quiz-editor-question-actions">
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, -1)}
                  disabled={qi === 0}
                  title="Вверх"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, 1)}
                  disabled={qi === questions.length - 1}
                  title="Вниз"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => removeQuestion(qi)}
                  title="Удалить вопрос"
                >
                  ×
                </button>
              </div>
            </div>

            <input
              value={q.question || ""}
              placeholder="Текст вопроса?"
              onChange={(e) => updateQuestion(qi, { question: e.target.value })}
            />

            <div className="quiz-editor-options">
              {(q.options || ["", ""]).map((opt, oi) => (
                <div key={oi} className="quiz-editor-row">
                  <input
                    type="radio"
                    name={`${radioPrefix}-q${qi}`}
                    checked={(q.correct_index ?? 0) === oi}
                    onChange={() =>
                      updateQuestion(qi, { correct_index: oi })
                    }
                    title="Правильный ответ"
                  />
                  <input
                    value={opt}
                    placeholder={`Вариант ${oi + 1}`}
                    onChange={(e) => setOption(qi, oi, e.target.value)}
                  />
                  <button
                    type="button"
                    className="danger"
                    onClick={() => removeOption(qi, oi)}
                    disabled={(q.options || []).length <= 2}
                    title="Удалить вариант"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addOption(qi)}
              >
                + вариант
              </button>
            </div>

            <textarea
              value={q.explanation || ""}
              placeholder="Объяснение (показывается после ответа)"
              onChange={(e) =>
                updateQuestion(qi, { explanation: e.target.value })
              }
            />
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addQuestion}>
          + Добавить вопрос
        </button>
      </div>
    </>
  );
}
