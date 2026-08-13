package logger

// MockLogger реализация Logger для тестов
// Записывает все сообщения в память для последующей проверки
type MockLogger struct {
	Messages []string
}

// NewMock создаёт новый mock логгер
func NewMock() *MockLogger {
	return &MockLogger{
		Messages: make([]string, 0),
	}
}

// Debug логирует сообщение на уровне Debug
func (l *MockLogger) Debug(msg string, args ...any) {
	l.Messages = append(l.Messages, "DEBUG: "+msg)
}

// Info логирует сообщение на уровне Info
func (l *MockLogger) Info(msg string, args ...any) {
	l.Messages = append(l.Messages, "INFO: "+msg)
}

// Warn логирует сообщение на уровне Warn
func (l *MockLogger) Warn(msg string, args ...any) {
	l.Messages = append(l.Messages, "WARN: "+msg)
}

// Error логирует сообщение на уровне Error
func (l *MockLogger) Error(msg string, args ...any) {
	l.Messages = append(l.Messages, "ERROR: "+msg)
}

// With создаёт новый mock логгер с дополнительными полями
func (l *MockLogger) With(args ...any) Logger {
	return l
}
