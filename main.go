package main

import (
	"log"

	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	ValidationKeycloak()
	CreateReq()

	log.Println("Server started at :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}

}
