package service

import (
	"errors"
	"regexp"
	"strings"

	"svarg_net/internal/model"
)

// Стоп-слова (корни — мат, оскорбления). Простой MVP-список.
// Позже можно вынести в таблицу БД и редактировать из админки.
var forbiddenWords = []string{
	// мат
	"блядь", "блять", "бля", "хуй", "хуя", "хуёв", "пизд", "пизд",
	"ебать", "ебан", "ёбан", "ебн", "ебуч",
	"сука", "сук", "пидор", "пидар", "мудак", "муда", "залуп",
	"гандон", "шлюх", "долбо", "дебил",
	// оскорбления
	"идиот", "дурак", "придурок", "урод", "тварь", "дерьм",
}

var emailRe = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func validateCommentFields(d model.CommentCreateData) error {
	name := strings.TrimSpace(d.AuthorName)
	if name == "" {
		return errors.New("name is required")
	}
	if len(name) < 2 || len(name) > 100 {
		return errors.New("name must be between 2 and 100 characters")
	}

	content := strings.TrimSpace(d.Content)
	if content == "" {
		return errors.New("content is required")
	}
	if len(content) < 3 || len(content) > 5000 {
		return errors.New("content must be between 3 and 5000 characters")
	}

	if d.AuthorEmail != nil && *d.AuthorEmail != "" {
		email := strings.TrimSpace(*d.AuthorEmail)
		if !emailRe.MatchString(email) {
			return errors.New("invalid email format")
		}
	}

	return nil
}

func containsForbidden(text string) bool {
	lower := strings.ToLower(text)
	for _, word := range forbiddenWords {
		if strings.Contains(lower, word) {
			return true
		}
	}
	return false
}
