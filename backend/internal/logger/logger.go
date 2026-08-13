package logger

import (
	"io"
	"log/slog"
	"os"
)

// Logger интерфейс для логирования
// Позволяет легко подменить реализацию (slog, zap, zerolog, etc.)
type Logger interface {
	// Debug логирует сообщение на уровне Debug
	Debug(msg string, args ...any)
	// Info логирует сообщение на уровне Info
	Info(msg string, args ...any)
	// Warn логирует сообщение на уровне Warn
	Warn(msg string, args ...any)
	// Error логирует сообщение на уровне Error
	Error(msg string, args ...any)
	// With создаёт новый логгер с дополнительными полями
	With(args ...any) Logger
}

// SlogLogger реализация Logger на основе стандартного slog
type SlogLogger struct {
	logger *slog.Logger
}

// New создаёт новый логгер на основе slog
// env: "development" - текстовый формат, "production" - JSON
func New(env string) Logger {
	var handler slog.Handler
	var output io.Writer = os.Stdout

	switch env {
	case "production":
		handler = slog.NewJSONHandler(output, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	case "development":
		handler = slog.NewTextHandler(output, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	default:
		handler = slog.NewJSONHandler(output, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	}

	return &SlogLogger{
		logger: slog.New(handler),
	}
}

// Debug логирует сообщение на уровне Debug
func (l *SlogLogger) Debug(msg string, args ...any) {
	l.logger.Debug(msg, args...)
}

// Info логирует сообщение на уровне Info
func (l *SlogLogger) Info(msg string, args ...any) {
	l.logger.Info(msg, args...)
}

// Warn логирует сообщение на уровне Warn
func (l *SlogLogger) Warn(msg string, args ...any) {
	l.logger.Warn(msg, args...)
}

// Error логирует сообщение на уровне Error
func (l *SlogLogger) Error(msg string, args ...any) {
	l.logger.Error(msg, args...)
}

// With создаёт новый логгер с дополнительными полями
func (l *SlogLogger) With(args ...any) Logger {
	return &SlogLogger{
		logger: l.logger.With(args...),
	}
}
