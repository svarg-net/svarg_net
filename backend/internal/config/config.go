package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config содержит всю конфигурацию приложения
type Config struct {
	App  App
	DB   Database
	CORS CORS
	JWT  JWT
}

// App конфигурация приложения
type App struct {
	Env  string // development, production
	Port string
}

// Database конфигурация базы данных
type Database struct {
	URL string
}

// CORS конфигурация CORS
type CORS struct {
	AllowedOrigins []string
}

// JWT конфигурация JWT
type JWT struct {
	Secret          string
	ExpirationHours int
}

// Load загружает конфигурацию из переменных окружения
func Load() (*Config, error) {
	// Пытаемся загрузить .env.local (для локальной разработки)
	if err := godotenv.Load(".env.local"); err == nil {
		// Файл найден и загружен
	} else {
		// Пытаемся загрузить обычный .env
		_ = godotenv.Load(".env")
	}

	env := getEnv("APP_ENV", "development")
	port := getEnv("APP_PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "")
	jwtSecret := getEnv("JWT_SECRET", "")
	jwtExpiration := getEnvInt("JWT_EXPIRATION_HOURS", 24)

	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	corsOrigins := parseOrigins(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"))

	return &Config{
		App: App{
			Env:  env,
			Port: port,
		},
		DB: Database{
			URL: dbURL,
		},
		CORS: CORS{
			AllowedOrigins: corsOrigins,
		},
		JWT: JWT{
			Secret:          jwtSecret,
			ExpirationHours: jwtExpiration,
		},
	}, nil
}

// getEnv возвращает значение переменной окружения или fallback
func getEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

// getEnvInt возвращает целочисленное значение переменной окружения или fallback
func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		var result int
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return fallback
}

// parseOrigins парсит список разрешённых origins через запятую
func parseOrigins(raw string) []string {
	var result []string
	for _, origin := range strings.Split(raw, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			result = append(result, origin)
		}
	}
	return result
}
