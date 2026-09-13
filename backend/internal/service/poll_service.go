package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

type PollResults struct {
	Counts []int `json:"counts"`
	Total  int   `json:"total"`
	Voted  bool  `json:"voted"`
}

type PollService interface {
	Vote(ctx context.Context, blockID int64, optionIndexes []int, r *http.Request) error
	Results(ctx context.Context, blockID int64, r *http.Request) (*PollResults, error)
}

type pollService struct {
	pollRepo  repository.PollRepository
	blockRepo repository.BlockRepository
}

func NewPollService(
	pollRepo repository.PollRepository,
	blockRepo repository.BlockRepository,
) PollService {
	return &pollService{pollRepo: pollRepo, blockRepo: blockRepo}
}

func (s *pollService) pollMeta(ctx context.Context, blockID int64) (int, bool, error) {
	block, err := s.blockRepo.GetByID(ctx, blockID)
	if err != nil {
		return 0, false, err
	}
	if block == nil {
		return 0, false, errors.New("block not found")
	}
	if block.Type != model.BlockTypePoll {
		return 0, false, errors.New("block is not a poll")
	}

	var data struct {
		Options  []string `json:"options"`
		Multiple bool     `json:"multiple"`
	}
	if err := json.Unmarshal(block.Data, &data); err != nil {
		return 0, false, fmt.Errorf("invalid poll data: %w", err)
	}
	return len(data.Options), data.Multiple, nil
}

func (s *pollService) Vote(ctx context.Context, blockID int64, optionIndexes []int, r *http.Request) error {
	optsCount, multiple, err := s.pollMeta(ctx, blockID)
	if err != nil {
		return err
	}

	if len(optionIndexes) == 0 {
		return errors.New("no options selected")
	}
	if !multiple && len(optionIndexes) > 1 {
		return errors.New("this poll allows only one option")
	}
	for _, idx := range optionIndexes {
		if idx < 0 || idx >= optsCount {
			return errors.New("invalid option index")
		}
	}

	ipHash := hashIP(r)

	voted, err := s.pollRepo.HasVoted(ctx, blockID, ipHash)
	if err != nil {
		return err
	}
	if voted {
		return errors.New("you have already voted in this poll")
	}

	return s.pollRepo.AddVotes(ctx, blockID, optionIndexes, ipHash)
}

func (s *pollService) Results(ctx context.Context, blockID int64, r *http.Request) (*PollResults, error) {
	optsCount, _, err := s.pollMeta(ctx, blockID)
	if err != nil {
		return nil, err
	}

	countsMap, err := s.pollRepo.GetCounts(ctx, blockID)
	if err != nil {
		return nil, err
	}

	total, err := s.pollRepo.TotalVoters(ctx, blockID)
	if err != nil {
		return nil, err
	}

	voted, err := s.pollRepo.HasVoted(ctx, blockID, hashIP(r))
	if err != nil {
		return nil, err
	}

	counts := make([]int, optsCount)
	for i := 0; i < optsCount; i++ {
		counts[i] = countsMap[i]
	}

	return &PollResults{Counts: counts, Total: total, Voted: voted}, nil
}
