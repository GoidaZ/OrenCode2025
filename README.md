# SecretManager

## Стек
- `frontend`: Next.js + TypeScript + Vite
- `client`: Tauri + Rust + Nuxt.js + TypeScript + Vite
- `backend`: Golang + Gin

## Сервисы
- OpenBao: хранилище секретов для всех пользователей(`http://localhost:8091/bao/`)
- Frontend: дэшборд с заявками для команды ИБ (`http://localhost:8091/`)
- Backend: бэкенд отвечающий за заявки и добавление секретов в OpenBao (`http://localhost:8091/api/`)
- nginx: прокси за которым сидит все вышеперечисленное

## Keycloak
Для правильной работы проекта необходимо, чтобы Keycloak был доступен публично. \
Потому я поднял свой инстанс на https://kc.airblo.ws/, от которого зависит этот проект. \
Чтобы изменить адрес на свой, необходимо:
1. В `.env` пропишите клиентский секрет как `KEYCLOAK_CLIENT_SECRET` 
2. В `.env` пропишите публичный URL как `KEYCLOAK_PUBLIC_URL`
3. В `openbao/config.hcl` пропишите клиентский секрет в поле `oidc_client_secret`
4. В `openbao/config.hcl` замените `https://kc.airblo.ws/` на свой публичный URL

## Поднятие на прод
Проект настроен под быстрый запуск локально, но для запуска на проде необходимо несколько дополнительных шагов.
1. Поставьте перед `:8091` прокси (например nginx) с включенным TLS со своим доменом (например `https://secretmanager.airblo.ws`)
2. В `openbao/config.hcl` прописать публичный URL в `allowed_redirect_uris` у `create-oidc-role-default` (например `https://secretmanager.airblo.ws/callback`)
3. В `openbao/config.hcl` замените `S0Z19QMNIovOj10B9v5Lwb9sPOXT1Xai` на другой пароль и пропишите его значание в `.env` как `OPENBAO_PASSWORD`

## Запуск сервисов
1. `git clone --recurse-submodules https://github.com/GoidaZ/OrenHack2025`
2. `cd OrenHack2025`
3. `sudo docker compose up -d`
4. PROFIT!

## Сборка клиента
Инструкция по сборке клиента находится в папке/ветке `client`
