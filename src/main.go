package main

import (
	"os"
	"log"
	"github.com/gin-gonic/gin"
	"orencode/src/routers"
	"github.com/joho/godotenv"
	"github.com/gin-contrib/cors"
)


func main() {
    godotenv.Load()

    r := gin.Default()

    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,
    }))

    routers.ValidationKeycloak(r)
    routers.CreateReq(r)

    log.Println("Server started at :8080")
    if err := r.Run(":" + os.Getenv("PORT")); err != nil {
        log.Fatal(err)
    }
}
