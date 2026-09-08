package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

type BlockHandler struct {
	blockService service.BlockService
	log          logger.Logger
}

func NewBlockHandler(blockService service.BlockService, log logger.Logger) *BlockHandler {
	return &BlockHandler{
		blockService: blockService,
		log:          log,
	}
}

// GET /api/v1/posts/{slug}/blocks — публично
func (h *BlockHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	blocks, err := h.blockService.ListPublic(r.Context(), slug)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"items": blocks})
}

// GET /api/v1/admin/posts/{id}/blocks
func (h *BlockHandler) ListForAdmin(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	blocks, err := h.blockService.ListForAdmin(r.Context(), postID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"items": blocks})
}

// POST /api/v1/admin/posts/{id}/blocks
func (h *BlockHandler) Create(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req struct {
		Type     string          `json:"type"`
		Data     json.RawMessage `json:"data"`
		Position *int            `json:"position,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	block, err := h.blockService.Create(r.Context(), model.BlockCreateData{
		PostID:   postID,
		Type:     req.Type,
		Data:     req.Data,
		Position: req.Position,
	})
	if err != nil {
		h.log.Warn("create block failed", "error", err)
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, block)
}

// PATCH /api/v1/admin/blocks/{id}
func (h *BlockHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	var req struct {
		Type *string          `json:"type,omitempty"`
		Data *json.RawMessage `json:"data,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	block, err := h.blockService.Update(r.Context(), id, model.BlockUpdateData{
		Type: req.Type,
		Data: req.Data,
	})
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, block)
}

// DELETE /api/v1/admin/blocks/{id}
func (h *BlockHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	if err := h.blockService.Delete(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// POST /api/v1/admin/posts/{id}/blocks/reorder
func (h *BlockHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req model.BlockReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.blockService.Reorder(r.Context(), postID, req.BlockIDs); err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "reordered"})
}

// POST /api/v1/admin/posts/{id}/convert-to-blocks
func (h *BlockHandler) ConvertToBlocks(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	if err := h.blockService.ConvertPostToBlocks(r.Context(), postID); err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "converted"})
}
