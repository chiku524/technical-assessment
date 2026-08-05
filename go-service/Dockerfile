FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /report-service .

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /report-service /app/report-service
EXPOSE 8080
CMD ["/app/report-service"]
