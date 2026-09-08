package model

import (
	"encoding/json"
	"time"
)

// Режимы контента поста
const (
	ContentModePlate  = "plate"  // старый Plate-редактор
	ContentModeBlocks = "blocks" // новый блочный редактор
)

// Типы блоков (волна 1)
const (
	BlockTypeText      = "text"
	BlockTypeImage     = "image"
	BlockTypeImageText = "image-text"
	BlockTypeCode      = "code"
	BlockTypeGallery   = "gallery"
	BlockTypeQuote     = "quote"
	BlockTypeCallout   = "callout"
	BlockTypeDivider   = "divider"
)

// AllowedBlockTypes — whitelist типов блоков.
// Волна 2 добавит: table, video, embed, download, poll, quiz, tabs
var AllowedBlockTypes = map[string]bool{
	BlockTypeText:      true,
	BlockTypeImage:     true,
	BlockTypeImageText: true,
	BlockTypeCode:      true,
	BlockTypeGallery:   true,
	BlockTypeQuote:     true,
	BlockTypeCallout:   true,
	BlockTypeDivider:   true,
}

// Block — один блок поста.
// Data храним как json.RawMessage: бэкенд не знает схему каждого типа,
// валидация специфичных полей — на фронте.
type Block struct {
	ID        int64           `json:"id"`
	PostID    int64           `json:"post_id"`
	Type      string          `json:"type"`
	Data      json.RawMessage `json:"data"`
	Position  int             `json:"position"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// BlockCreateData — входные данные для создания блока
type BlockCreateData struct {
	PostID   int64           `json:"post_id"`
	Type     string          `json:"type"`
	Data     json.RawMessage `json:"data"`
	Position *int            `json:"position,omitempty"` // nil = в конец
}

// BlockUpdateData — входные данные для обновления блока
type BlockUpdateData struct {
	Type *string          `json:"type,omitempty"`
	Data *json.RawMessage `json:"data,omitempty"`
}

// BlockReorderRequest — новый порядок блоков поста
type BlockReorderRequest struct {
	BlockIDs []int64 `json:"block_ids"`
}
