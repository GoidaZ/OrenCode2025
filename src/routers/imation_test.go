package routers_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"orencode/src/routers"

)

// --- моки ---
type MockHandlers struct{ mock.Mock }

func (m *MockHandlers) OnNewCred(ctx context.Context, c routers.Cred) error {
	args := m.Called(ctx, c)
	return args.Error(0)
}
func (m *MockHandlers) OnAutoConfirm(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// --- тесты ---
func TestGenCredForTest(t *testing.T) {
	cred := routers.GenCredForTest()
	assert.NotEmpty(t, cred.Username)
	assert.Contains(t, cred.Email, "@")
	assert.NotEmpty(t, cred.Password)
	assert.NotEmpty(t, cred.Token)
}

func TestRunImitation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	mockH := new(MockHandlers)
	mockH.On("OnNewCred", mock.Anything, mock.AnythingOfType("routers.Cred")).Return(nil).Maybe()
	mockH.On("OnAutoConfirm", mock.Anything).Return(nil).Maybe()

	cfg := routers.Config{
		Enabled:         true,
		CredInterval:    50 * time.Millisecond,
		ConfirmInterval: 50 * time.Millisecond,
	}

	h := routers.Handlers{
		OnNewCred:     mockH.OnNewCred,
		OnAutoConfirm: mockH.OnAutoConfirm,
	}

	routers.Run(ctx, cfg, h)

	time.Sleep(200 * time.Millisecond)

	mockH.AssertCalled(t, "OnNewCred", mock.Anything, mock.AnythingOfType("routers.Cred"))
	mockH.AssertCalled(t, "OnAutoConfirm", mock.Anything)
}