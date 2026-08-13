package router

import (
	"encoding/json"
	"net/http"

	"svarg_net/internal/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

// healthResponse структура ответа health-check
type healthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

// healthHandler возвращает статус сервиса и базы данных
func healthHandler(pool *pgxpool.Pool, log logger.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		response := healthResponse{
			Status:   "ok",
			Database: "ok",
		}

		if err := pool.Ping(r.Context()); err != nil {
			response.Status = "degraded"
			response.Database = "unavailable"
			log.Error("database health check failed", "error", err)

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			_ = json.NewEncoder(w).Encode(response)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
	}
}
