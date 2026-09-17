"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/styles/notfound.css";

const LINES = [
  "> VAULT-TEC OS v4.0.4 :: протокол поиска страницы...",
  "> Сканирование пустоши... сектор 404...",
  "> ОШИБКА: запрошенная страница не найдена.",
  "> Проснись, Нео...",
  "> Матрица держит тебя.",
  "> Следуй за белым кроликом — вернись на главную.",
];

const RAIN_CHARS = "アカサタナハマヤラワ0123456789ABCDEF<>*+-=";

/**
 * Печатающиеся строки терминала
 */
function useTypewriter(lines: string[], speed = 28, lineDelay = 350) {
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    let line = 0;
    let char = 0;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled || line >= lines.length) return;

      const current = lines[line].slice(0, char + 1);
      setOutput((prev) => {
        const next = prev.slice(0, line);
        next[line] = current;
        return next;
      });

      char += 1;
      if (char >= lines[line].length) {
        line += 1;
        char = 0;
        timeout = setTimeout(tick, lineDelay);
      } else {
        timeout = setTimeout(tick, speed);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [lines, speed, lineDelay]);

  return output;
}

/**
 * Matrix-rain на canvas
 */
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Уважаем prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const fontSize = 16;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let drops = Array.from({ length: Math.floor(width / fontSize) }, () =>
      Math.floor(Math.random() * -100)
    );

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const symbol = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
        ctx.fillStyle = Math.random() > 0.975 ? "#c8ffc8" : "#00ff41";
        ctx.fillText(symbol, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }
    };

    const interval = setInterval(draw, 50);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drops = Array.from({ length: Math.floor(width / fontSize) }, () =>
        Math.floor(Math.random() * -100)
      );
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="nf-rain" aria-hidden="true" />;
}

export default function NotFoundTerminal() {
  const lines = useTypewriter(LINES);

  return (
    <div className="nf-root">
      <MatrixRain />
      <div className="nf-scanlines" aria-hidden="true" />

      <div className="nf-terminal" role="alert">
        <div className="nf-header">
          <span>Vault-Tec Industries</span>
          <span>Terminal 404</span>
        </div>

        <h1 className="nf-title">404</h1>
        <div className="nf-subtitle">Page not found</div>

        <div className="nf-lines">
          {lines.map((line, i) => (
            <span
              key={i}
              className={
                "nf-line" + (line.startsWith("> ОШИБКА") ? " nf-line--error" : "")
              }
            >
              {line}
            </span>
          ))}
          <span className="nf-cursor" aria-hidden="true" />
        </div>

        <div className="nf-actions">
          <Link href="/" className="nf-link">
            [ Вернуться в убежище ]
          </Link>
          <Link href="/search" className="nf-link nf-link--amber">
            [ Искать в терминале ]
          </Link>
        </div>
      </div>
    </div>
  );
}
