package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

const (
	maxFileSize = 5 * 1024 * 1024 // 5 MB
	uploadDir   = "/app/uploads"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

type MediaService interface {
	Upload(ctx context.Context, file *multipart.FileHeader, userID int64) (*model.MediaFile, error)
	List(ctx context.Context, limit, offset int) ([]*model.MediaFile, error)
	GetByID(ctx context.Context, id int64) (*model.MediaFile, error)
	Delete(ctx context.Context, id int64) error
	GetFilePath(ctx context.Context, id int64) (string, error)
}

type mediaService struct {
	mediaRepo repository.MediaRepository
	log       logger.Logger
}

func NewMediaService(mediaRepo repository.MediaRepository, log logger.Logger) MediaService {
	return &mediaService{
		mediaRepo: mediaRepo,
		log:       log,
	}
}

func (s *mediaService) Upload(ctx context.Context, fileHeader *multipart.FileHeader, userID int64) (*model.MediaFile, error) {
	// Проверяем размер
	if fileHeader.Size > maxFileSize {
		return nil, fmt.Errorf("file size exceeds %d MB limit", maxFileSize/(1024*1024))
	}

	// Открываем файл
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Читаем первые байты для определения MIME type
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	mimeType := strings.ToLower(strings.Split(fileHeader.Header.Get("Content-Type"), ";")[0])
	if !allowedMimeTypes[mimeType] {
		return nil, fmt.Errorf("file type %s not allowed", mimeType)
	}

	// Возвращаем курсор в начало
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("failed to seek file: %w", err)
	}

	// Генерируем уникальное имя файла
	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		return nil, fmt.Errorf("failed to generate random filename: %w", err)
	}

	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("%s-%s%s", time.Now().Format("20060102-150405"), hex.EncodeToString(randomBytes), ext)

	// Создаём директорию если её нет
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Сохраняем файл на диск
	filePath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Создаём запись в БД
	mediaFile := &model.MediaFile{
		Filename:     filename,
		OriginalName: fileHeader.Filename,
		MimeType:     mimeType,
		SizeBytes:    fileHeader.Size,
		Path:         filePath,
		UploadedBy:   &userID,
	}

	if err := s.mediaRepo.Save(ctx, mediaFile); err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save media metadata: %w", err)
	}

	mediaFile.URL = fmt.Sprintf("/api/v1/media/%d/file", mediaFile.ID)

	s.log.Info("media file uploaded",
		"id", mediaFile.ID,
		"filename", filename,
		"original", fileHeader.Filename,
		"size", fileHeader.Size,
		"user_id", userID,
	)

	return mediaFile, nil
}

func (s *mediaService) List(ctx context.Context, limit, offset int) ([]*model.MediaFile, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	files, err := s.mediaRepo.List(ctx, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list media files: %w", err)
	}

	for _, f := range files {
		f.URL = fmt.Sprintf("/api/v1/media/%d/file", f.ID)
	}

	return files, nil
}

func (s *mediaService) GetByID(ctx context.Context, id int64) (*model.MediaFile, error) {
	file, err := s.mediaRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	file.URL = fmt.Sprintf("/api/v1/media/%d/file", file.ID)
	return file, nil
}

func (s *mediaService) Delete(ctx context.Context, id int64) error {
	file, err := s.mediaRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Удаляем файл с диска
	if err := os.Remove(file.Path); err != nil && !os.IsNotExist(err) {
		s.log.Warn("failed to delete file from disk", "path", file.Path, "error", err)
	}

	// Удаляем из БД
	if err := s.mediaRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete media file: %w", err)
	}

	s.log.Info("media file deleted", "id", id, "filename", file.Filename)
	return nil
}

func (s *mediaService) GetFilePath(ctx context.Context, id int64) (string, error) {
	file, err := s.mediaRepo.GetByID(ctx, id)
	if err != nil {
		return "", err
	}
	return file.Path, nil
}
