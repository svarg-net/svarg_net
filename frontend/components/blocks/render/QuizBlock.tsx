"use client";

import { useState, useEffect, useMemo } from "react";
import { useLesson } from "@/context/LessonContext";
import { submitQuiz } from "@/lib/api";
import type { QuizBlockData } from "@/lib/api/public/blocks";

type Phase = "answering" | "feedback" | "finished";

export default function QuizBlock({ data }: { data: QuizBlockData }) {
  const lesson = useLesson();
  const questions = useMemo(() => data.questions || [], [data.questions]);
  const total = questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("answering");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Отправка результатов на backend при завершении
  useEffect(() => {
    if (phase !== "finished" || !lesson?.lessonId) return;

    const right = questions.reduce(
      (acc, qq, i) => acc + (answers[i] === (qq.correct_index ?? 0) ? 1 : 0),
      0
    );
    const percent = Math.round((right / total) * 100);

    // Проверка доступа
    if (!lesson.isAuthenticated) {
      setSubmitError("Войдите в систему для сдачи теста");
      return;
    }
    if (!lesson.isEnrolled) {
      setSubmitError("Запишитесь на курс для сдачи теста");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    submitQuiz(lesson.lessonId, percent)
      .then((progress) => {
        setPassed(progress.completed_at !== null);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Ошибка сохранения";
        if (msg.includes("enrollment")) {
          setSubmitError("Запишитесь на курс для сдачи теста");
        } else {
          setSubmitError(msg);
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [phase, lesson?.lessonId, lesson?.isAuthenticated, lesson?.isEnrolled, answers, questions, total]);

  if (questions.length === 0) return null;

  const q = questions[idx];
  const correct = q.correct_index ?? 0;
  const answered = answers[idx] !== undefined;

  const handleSelect = (oi: number) => {
    if (answered) return;
    const next = [...answers];
    next[idx] = oi;
    setAnswers(next);
    setPhase("feedback");
  };

  const handleNext = () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setPhase(answers[idx + 1] !== undefined ? "feedback" : "answering");
    } else {
      setPhase("finished");
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setAnswers([]);
    setPhase("answering");
  };



  // Экран результата
  if (phase === "finished") {
    const right = questions.reduce(
      (acc, qq, i) => acc + (answers[i] === (qq.correct_index ?? 0) ? 1 : 0),
      0
    );
    const percent = Math.round((right / total) * 100);
    const minScore = lesson?.minScore ?? 0;

    return (
      <div className="block block-quiz block-quiz--finished">
        {data.title && (
          <div className="block-quiz-title">{data.title}</div>
        )}
        <div className="block-quiz-score">
          <div className="block-quiz-score-num">
            {right} / {total}
          </div>
          <div className="block-quiz-score-pct">{percent}% правильных</div>
          <div className="block-quiz-score-bar">
            <div
              className="block-quiz-score-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {submitting && (
          <div className="block-quiz-submitting">Сохранение результата...</div>
        )}

        {submitError && (
          <div className="block-quiz-error">{submitError}</div>
        )}

        {!submitting && !submitError && passed !== null && (
          <div className={passed ? "block-quiz-passed" : "block-quiz-failed"}>
            {passed ? (
              <>
                <strong>✅ Тест пройден!</strong>
                <p>Урок засчитан как завершённый.</p>
              </>
            ) : (
              <>
                <strong>❌ Тест не пройден</strong>
                <p>Требуется минимум {minScore}% правильных ответов.</p>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          className="block-quiz-reset"
          onClick={handleRestart}
        >
          Пройти заново
        </button>
      </div>
    );
  }

  // Шаг: вопрос или фидбэк
  const isRight = answers[idx] === correct;

  return (
    <div className="block block-quiz">
      {data.title && (
        <div className="block-quiz-title">{data.title}</div>
      )}

      <div className="block-quiz-progress">
        <span>
          Вопрос {idx + 1} из {total}
        </span>
        <div className="block-quiz-progress-bar">
          <div
            className="block-quiz-progress-bar-fill"
            style={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {q.question && (
        <div className="block-quiz-question">{q.question}</div>
      )}

      <div className="block-quiz-options">
        {(q.options || []).map((opt, oi) => {
          let cls = "block-quiz-option";
          if (phase === "feedback" && oi === correct) cls += " is-correct";
          else if (phase === "feedback" && oi === answers[idx])
            cls += " is-wrong";
          return (
            <button
              key={oi}
              type="button"
              className={cls}
              disabled={phase === "feedback"}
              onClick={() => handleSelect(oi)}
            >
              <span className="block-quiz-marker">
                {phase === "feedback" && oi === correct
                  ? "✓"
                  : phase === "feedback" && oi === answers[idx]
                    ? "✗"
                    : String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {phase === "feedback" && (
        <div
          className={
            "block-quiz-result " + (isRight ? "is-right" : "is-wrong")
          }
        >
          <strong>
            {isRight
              ? "Верно! 🎉"
              : `Неверно. Правильный ответ: ${q.options?.[correct]}`}
          </strong>
          {q.explanation && (
            <div className="block-quiz-explanation">{q.explanation}</div>
          )}
          <button
            type="button"
            className="block-quiz-next"
            onClick={handleNext}
          >
            {idx < total - 1 ? "Следующий вопрос →" : "Показать результат"}
          </button>
        </div>
      )}
    </div>
  );
}
