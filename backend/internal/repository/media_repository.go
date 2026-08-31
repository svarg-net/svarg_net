package repository

import (
	"context"
	"fmt"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MediaRepository interface {
	Save(ctx context.Context, file *model.MediaFile) error
	GetByID(ctx context.Context, id int64) (*model.MediaFile, error)
	List(ctx context.Context, limit, offset int) ([]*model.MediaFile, error)
	Delete(ctx context.Context, id int64) error
}

type mediaRepository struct {
	pool *pgxpool.Pool
}

func NewMediaRepository(pool *pgxpool.Pool) MediaRepository {
	return &mediaRepository{pool: pool}
}

func (r *mediaRepository) Save(ctx context.Context, file *model.MediaFile) error {
	query := `
		INSERT INTO media_files (filename, original_name, mime_type, size_bytes, path, uploaded_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query,
		file.Filename, file.OriginalName, file.MimeType,
		file.SizeBytes, file.Path, file.UploadedBy,
	).Scan(&file.ID, &file.CreatedAt)
}

func (r *mediaRepository) GetByID(ctx context.Context, id int64) (*model.MediaFile, error) {
	file := &model.MediaFile{}
	query := `
		SELECT id, filename, original_name, mime_type, size_bytes, path, uploaded_by, created_at
		FROM media_files
		WHERE id = $1
	`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&file.ID, &file.Filename, &file.OriginalName, &file.MimeType,
		&file.SizeBytes, &file.Path, &file.UploadedBy, &file.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("media file not found")
	}
	return file, err
}

func (r *mediaRepository) List(ctx context.Context, limit, offset int) ([]*model.MediaFile, error) {
	query := `
		SELECT id, filename, original_name, mime_type, size_bytes, path, uploaded_by, created_at
		FROM media_files
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []*model.MediaFile
	for rows.Next() {
		file := &model.MediaFile{}
		if err := rows.Scan(
			&file.ID, &file.Filename, &file.OriginalName, &file.MimeType,
			&file.SizeBytes, &file.Path, &file.UploadedBy, &file.CreatedAt,
		); err != nil {
			return nil, err
		}
		files = append(files, file)
	}
	return files, nil
}

func (r *mediaRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM media_files WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
