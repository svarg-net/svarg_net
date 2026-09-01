package model

import "time"

type MediaFile struct {
	ID           int64     `json:"id"`
	Filename     string    `json:"filename"`
	OriginalName string    `json:"original_name"`
	MimeType     string    `json:"mime_type"`
	SizeBytes    int64     `json:"size_bytes"`
	Path         string    `json:"path"`
	UploadedBy   *int64    `json:"uploaded_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	URL          string    `json:"url"`
}
