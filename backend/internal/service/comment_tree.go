package service

import "svarg_net/internal/model"

// buildTree группирует плоский список в дерево с 1 уровнем вложенности.
func buildTree(flat []model.Comment) []model.Comment {
	byID := make(map[int64]*model.Comment, len(flat))
	for i := range flat {
		c := &flat[i]
		c.Replies = nil
		byID[c.ID] = c
	}

	var roots []model.Comment
	for i := range flat {
		c := &flat[i]
		if c.ParentID == nil {
			roots = append(roots, *c)
		} else if parent, ok := byID[*c.ParentID]; ok {
			parent.Replies = append(parent.Replies, *c)
		} else {
			// orphan — считаем корневым
			roots = append(roots, *c)
		}
	}
	return roots
}
