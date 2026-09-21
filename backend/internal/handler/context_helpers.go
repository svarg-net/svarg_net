package handler

import (
	"context"
	"net/http"

	"svarg_net/internal/model"
)

// getUserFromRequest извлекает *model.User из request context
func getUserFromRequest(r *http.Request) (*model.User, bool) {
	user, ok := r.Context().Value("user").(*model.User)
	return user, ok
}

// getUserFromContext извлекает *model.User из context
func getUserFromContext(ctx context.Context) (*model.User, bool) {
	user, ok := ctx.Value("user").(*model.User)
	return user, ok
}
