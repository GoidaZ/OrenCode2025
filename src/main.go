package main

import (
	"os"
	"log"
	"github.com/gin-gonic/gin"
	"orencode/src/routers"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	r := gin.Default()

	routers.ValidationKeycloak(r)
	// authMiddleware := 
	routers.CreateReq(r)

	log.Println("Server started at :8080")
	if err := r.Run(":" + os.Getenv("PORT")); err != nil {
		log.Fatal(err)
	}

}
