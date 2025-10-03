package models

import "time"

type Request struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"type:varchar(200);not null"`
	Description string    `json:"description" gorm:"type:text"`
	Creator     string    `json:"creator" gorm:"type:varchar(100);not null"`
	CreatedAt   time.Time `json:"created_at"`
}
