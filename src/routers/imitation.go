package routers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"math/big"
	"strings"
	"time"
)

type Cred struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Token    string `json:"token"`
}

type Handlers struct {
	OnNewCred     func(ctx context.Context, c Cred) error
	OnAutoConfirm func(ctx context.Context) error
}

type Config struct {
	Enabled         bool
	CredInterval    time.Duration
	ConfirmInterval time.Duration
}

func Run(ctx context.Context, cfg Config, h Handlers) {
	if !cfg.Enabled {
		return
	}
	log.Printf("[imitation] enabled (cred=%s confirm=%s)", cfg.CredInterval, cfg.ConfirmInterval)

	go func() {
		t := time.NewTicker(cfg.CredInterval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				cred := genCred()
				if h.OnNewCred != nil {
					_ = h.OnNewCred(ctx, cred)
				}
			}
		}
	}()

	go func() {
		t := time.NewTicker(cfg.ConfirmInterval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				if h.OnAutoConfirm != nil {
					_ = h.OnAutoConfirm(ctx)
				}
			}
		}
	}()
}
func genCred() Cred {
	u := randomUsername(8)
	return Cred{
		Username: u,
		Email:    u + "@example.test",
		Password: randomPassword(12),
		Token:    randomHex(24),
	}
}

func GenCredForTest() Cred { return genCred() }

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func randomUsername(n int) string {
	letters := "abcdefghijklmnopqrstuvwxyz"
	var sb strings.Builder
	for i := 0; i < n; i++ {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		sb.WriteByte(letters[idx.Int64()])
	}
	return sb.String()
}

func randomPassword(n int) string {
	chars := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%&*()-_=+"
	var sb strings.Builder
	for i := 0; i < n; i++ {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		sb.WriteByte(chars[idx.Int64()])
	}
	return sb.String()
}
