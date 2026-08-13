# Stage 1: Build
FROM golang:1.25-alpine AS build

WORKDIR /src

# Копируем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходники
COPY . .

# Собираем бинарник
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /bin/api ./cmd/api

# Stage 2: Runtime
FROM alpine:3.21

# Устанавливаем ca-certificates и wget для healthcheck
RUN apk add --no-cache ca-certificates wget && \
    adduser -D -u 10001 app

# Копируем бинарник
COPY --from=build /bin/api /usr/local/bin/api

# Переключаемся на непривилегированного пользователя
USER app

EXPOSE 8080

CMD ["api"]