# SecretManager

## Стек
- `frontend`: Next.js + TypeScript + Vite
- `client`: Tauri + Rust + Nuxt.js + TypeScript + Vite
- `backend`: Golang + Gin

## Сервисы
- Keycloak: сервис авторизации для OpenBao и бэкенда (`http://localhost:8090/`)
- OpenBao: хранилище секретов для всех пользователей(`http://localhost:8091/bao/`)
- Frontend: дэшборд с заявками для команды ИБ (`http://localhost:8091/`)
- Backend: бэкенд отвечающий за заявки и добавление секретов в OpenBao (`http://localhost:8091/api/`)
- nginx: прокси за которым сидит все вышеперечисленное

## Запуск сервисов
1. `sudo docker compose up -d`
2. PROFIT!

## Сборка клиента
TODO
