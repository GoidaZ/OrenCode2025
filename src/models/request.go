package models

import (
	"time"

	"github.com/google/uuid"
)

type Request struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Creator   uuid.UUID `json:"creator" gorm:"type:uuid;not null"`
	Resource  string    `json:"resource" gorm:"type:varchar(100);not null"`
	Reason    string    `json:"reason" gorm:"type:text"`
	ValidFor  string    `json:"valid_for" gorm:"type:varchar(50)"`       // e.g., "1h", "24h", "7d"
	Status    string    `json:"status" gorm:"type:varchar(20);not null"` // PENDING / ACCEPT / REJECT
	CreatedAt time.Time `json:"created_at"`
}
