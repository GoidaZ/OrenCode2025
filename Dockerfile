FROM node:22-alpine AS deps
WORKDIR /home/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM node:22-alpine AS build
WORKDIR /home/app
COPY --from=deps /home/app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:22-alpine AS production
WORKDIR /home/app
COPY --from=build /home/app ./
EXPOSE 3000
CMD ["yarn", "start", "-H", "0.0.0.0", "-p", "3000"]