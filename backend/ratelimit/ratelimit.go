package ratelimit

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type entry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type Middleware struct {
	mu      sync.Mutex
	ips     map[string]*entry
	r       rate.Limit
	burst   int
}

// New creates a per-IP rate limiter.
// r = sustained requests per second, burst = max instantaneous requests.
func New(r rate.Limit, burst int) *Middleware {
	m := &Middleware{
		ips:   make(map[string]*entry),
		r:     r,
		burst: burst,
	}
	go m.cleanup()
	return m
}

func (m *Middleware) get(ip string) *rate.Limiter {
	m.mu.Lock()
	defer m.mu.Unlock()
	e, ok := m.ips[ip]
	if !ok {
		e = &entry{limiter: rate.NewLimiter(m.r, m.burst)}
		m.ips[ip] = e
	}
	e.lastSeen = time.Now()
	return e.limiter
}

// cleanup removes IPs that haven't been seen in 10 minutes.
func (m *Middleware) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		m.mu.Lock()
		for ip, e := range m.ips {
			if time.Since(e.lastSeen) > 10*time.Minute {
				delete(m.ips, ip)
			}
		}
		m.mu.Unlock()
	}
}

func (m *Middleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := realIP(r)
		if !m.get(ip).Allow() {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// realIP extracts the client IP, respecting X-Forwarded-For from Render's proxy.
func realIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// May be comma-separated; take the first (original client)
		if i := strings.Index(xff, ","); i > 0 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
