package models

import (
	"time"
	"github.com/google/uuid"
)

type Request struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Key       string    `json:"key" gorm:"type:varchar(100);unique;not null"`
	Creator   uuid.UUID `json:"creator" gorm:"type:uuid;not null"`
	Status    string    `json:"status" gorm:"type:varchar(20);not null"` // ACCEPT / REJECT / PENDING
	CreatedAt time.Time `json:"created_at"`
}
