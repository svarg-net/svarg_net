package router

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// ipLimiter лимитер для одного IP
type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// rateLimiterStore хранилище лимитеров по IP
type rateLimiterStore struct {
	mu       sync.Mutex
	limiters map[string]*ipLimiter
	rate     rate.Limit
	burst    int
}

func newRateLimiterStore(r rate.Limit, burst int) *rateLimiterStore {
	s := &rateLimiterStore{
		limiters: make(map[string]*ipLimiter),
		rate:     r,
		burst:    burst,
	}
	go s.cleanupLoop()
	return s
}

func (s *rateLimiterStore) getLimiter(ip string) *rate.Limiter {
	s.mu.Lock()
	defer s.mu.Unlock()

	if v, ok := s.limiters[ip]; ok {
		v.lastSeen = time.Now()
		return v.limiter
	}

	l := rate.NewLimiter(s.rate, s.burst)
	s.limiters[ip] = &ipLimiter{limiter: l, lastSeen: time.Now()}
	return l
}

// cleanupLoop удаляет неактивные лимитеры
func (s *rateLimiterStore) cleanupLoop() {
	ticker := time.NewTicker(3 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		for ip, v := range s.limiters {
			if time.Since(v.lastSeen) > 10*time.Minute {
				delete(s.limiters, ip)
			}
		}
		s.mu.Unlock()
	}
}

// clientIP извлекает IP клиента (с учётом будущих прокси)
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip := strings.TrimSpace(strings.Split(xff, ",")[0]); ip != "" {
			return ip
		}
	}

	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return strings.TrimSpace(xrip)
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// rateLimitMiddleware ограничивает количество запросов по IP
func rateLimitMiddleware(store *rateLimiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !store.getLimiter(clientIP(r)).Allow() {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "1")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "too many requests",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
