package repository

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strings"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
)

// commentColumns — базовые колонки для SELECT комментариев.
const commentColumns = `id, post_id, parent_id, author_name, author_email,
	content, status, ip_hash, created_at, updated_at`

// scanComment читает одну строку комментария. Возвращает (nil, nil) если нет строк.
func scanComment(row pgx.Row) (*model.Comment, error) {
	var c model.Comment
	var authorEmail *string

	err := row.Scan(
		&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &authorEmail,
		&c.Content, &c.Status, &c.IPHash, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan comment: %w", err)
	}

	if authorEmail != nil && *authorEmail != "" {
		email := strings.ToLower(strings.TrimSpace(*authorEmail))
		hash := md5.Sum([]byte(email))
		c.GravatarID = hex.EncodeToString(hash[:])
	}
	return &c, nil
}

// scanComments читает все строки результата в срез комментариев.
func scanComments(rows pgx.Rows) ([]model.Comment, error) {
	defer rows.Close()

	comments := []model.Comment{}
	for rows.Next() {
		c, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		if c != nil {
			comments = append(comments, *c)
		}
	}
	return comments, nil
}

// scanAdminComments читает админские комментарии (с post_title через JOIN).
// post_title сканируется, но не сохраняется в модель (как было в оригинале).
func scanAdminComments(rows pgx.Rows) ([]model.Comment, error) {
	defer rows.Close()

	comments := []model.Comment{}
	for rows.Next() {
		var c model.Comment
		var authorEmail *string
		var postTitle string

		err := rows.Scan(
			&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &authorEmail,
			&c.Content, &c.Status, &c.IPHash, &c.CreatedAt, &c.UpdatedAt,
			&postTitle,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan admin comment: %w", err)
		}

		if authorEmail != nil && *authorEmail != "" {
			email := strings.ToLower(strings.TrimSpace(*authorEmail))
			hash := md5.Sum([]byte(email))
			c.GravatarID = hex.EncodeToString(hash[:])
		}
		_ = postTitle // сканируем для JOIN, но не сохраняем
		comments = append(comments, c)
	}
	return comments, nil
}
