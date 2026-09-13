package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

type PollHandler struct {
	pollService service.PollService
	log         logger.Logger
}

func NewPollHandler(pollService service.PollService, log logger.Logger) *PollHandler {
	return &PollHandler{pollService: pollService, log: log}
}

type pollVoteRequest struct {
	OptionIndexes []int `json:"option_indexes"`
}

func writePollError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func (h *PollHandler) Vote(w http.ResponseWriter, r *http.Request) {
	blockID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writePollError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	var req pollVoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writePollError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.pollService.Vote(r.Context(), blockID, req.OptionIndexes, r); err != nil {
		h.log.Warn("poll vote failed", "block_id", blockID, "error", err)
		writePollError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *PollHandler) Results(w http.ResponseWriter, r *http.Request) {
	blockID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writePollError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	results, err := h.pollService.Results(r.Context(), blockID, r)
	if err != nil {
		writePollError(w, http.StatusNotFound, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(results)
}
