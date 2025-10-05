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

## Поднятие на прод
Проект настроен под быстрый запуск локально, но для запуска на проде необходимо несколько дополнительных шагов.
1. В `keycloak/secretmanager-realm.json` прописать публичный URL в `redirectUris` и `webOrigins`
2. В `openbao/config.hcl` прописать публичный URL в `allowed_redirect_uris` у `create-oidc-role-default`
3. Поставьте перед `:8090` и `:8091` прокси (например nginx) желательно с включенным TLS на двух разных сабдоменах (например `keycloak.airblo.ws` и `secretmanager.airblo.ws`)

## Запуск сервисов
1. `sudo docker compose up -d`
2. PROFIT!

## Сборка клиента
TODO
