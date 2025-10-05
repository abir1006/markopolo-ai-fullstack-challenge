# Markopolo AI Fullstack Challenge - Setup Guide
This application creates a Perplexity-like chat interface that connects to data sources (GTM, Facebook Pixel, Shopify) and channels (Email, SMS, Push, WhatsApp) to generate real-time campaign recommendations.
Architecture

Backend: FastAPI with streaming responses
Frontend: React with real-time streaming
Data Sources: GTM, Facebook Pixel, Shopify
Channels: Email, SMS, Push Notifications, WhatsApp

## 🧩 Features

- Real-time streaming campaign recommendations
- Interactive data source connections 
- Channel enablement and configuration 
- Campaign execution simulation 
- Structured JSON output for campaign execution

## 🐳 Docker Setup & Run Instructions

Make sure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/)  
- [Docker Compose](https://docs.docker.com/compose/install/)

# Run the following command
```bash
git clone https://github.com/abir1006/markopolo-ai-fullstack-challenge
cd markopolo-ai-fullstack-challenge
docker compose up --build
```
- Open the browser and run frontend from http://localhost:3000
- backend should run on: http://localhost:8000

To stop the app run
```
docker compose down
``` 
