# SecretManager

## Стек
- `frontend`: Next.js + TypeScript + Vite
- `client`: Tauri + Rust + Nuxt.js + TypeScript + Vite
- `backend`: Golang + Gin

## Сервисы
- Keycloak: сервис авторизации для OpenBao и бэкенда (`http://localhost:5858/`)
- OpenBao: хранилище секретов для всех пользователей(`http://localhost:5859/bao/`)
- Frontend: дэшборд с заявками для команды ИБ (`http://localhost:5859/`)
- Backend: бэкенд отвечающий за заявки и добавление секретов в OpenBao (`http://localhost:5859/api/`)
- nginx: прокси за которым сидит все вышеперечисленное

## Запуск сервисов
1. `sudo docker compose up -d`
2. PROFIT!

## Сборка клиента
TODO
