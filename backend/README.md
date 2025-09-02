# SmartPrice Backend

AI-powered e-commerce and travel assistant with credit card optimization.

## Overview

SmartPrice Backend is a FastAPI-based service that provides intelligent analysis for:
- **Product Search**: Compare prices across e-commerce platforms with credit card optimization
- **Grocery Shopping**: Analyze grocery prices with unit pricing and delivery optimization
- **Flight Booking**: Find the best flight deals with credit card benefits

## Features

- 🤖 **AI-Powered Analysis**: Uses Google Gemini AI for intelligent query processing
- 💳 **Credit Card Optimization**: Integrates comprehensive credit card database for maximum savings
- 🔍 **Intent Classification**: Automatically detects user intent and routes to appropriate agents
- 🚀 **Multi-Domain Support**: Handles products, groceries, and flights in a unified system
- 💬 **Conversational Interface**: Natural language processing for user queries
- 📊 **Real-time Analysis**: Dynamic price comparison and optimization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │   Orchestrator  │    │   Domain Agents │
│                 │    │                 │    │                 │
│  - Chat API     │───▶│  - Intent       │───▶│  - Product      │
│  - Health Check │    │    Classification│    │  - Grocery     │
│  - Tools API    │    │  - Agent        │    │  - Flight      │
│                 │    │    Routing      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Tools Layer   │
                       │                 │
                       │  - Scraping     │
                       │  - Data Parsing │
                       │  - Validation   │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.8+
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   # Create .env file
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   echo "ENVIRONMENT=development" >> .env
   ```

4. **Run the server**
   ```bash
   python main.py
   ```

The server will start at `http://localhost:8000`

### API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and capabilities |
| `/chat` | POST | Main conversational endpoint |
| `/health` | GET | System health status |
| `/capabilities` | GET | Available domains and features |
| `/tools` | GET | List of available tools |
| `/credit-cards` | GET | Available credit card database |
| `/sessions/{id}` | GET | Session information and history |

### Chat API

**POST** `/chat`

Request:
```json
{
  "query": "I want to buy an iPhone 15",
  "credit_card": "HDFC Bank Millennia",
  "session_id": "optional_session_id",
  "context": {}
}
```

Response:
```json
{
  "conversation_id": "uuid",
  "timestamp": "2025-01-15T10:30:00",
  "message": "I found 3 iPhone 15 options with credit card optimization",
  "intent": "product_search",
  "agent_used": "product",
  "data": {
    "products": [...],
    "best_deal": {...},
    "total_savings": 2500
  },
  "actions": [...],
  "status": "success"
}
```

## Domain Agents

### 1. Product Agent
- **Purpose**: Analyze e-commerce products and optimize purchases
- **Capabilities**: Price comparison, credit card optimization, deal analysis
- **Supported Platforms**: Amazon, Flipkart, etc.

### 2. Grocery Agent
- **Purpose**: Optimize grocery shopping with unit pricing
- **Capabilities**: Unit price analysis, delivery optimization, bulk deals
- **Supported Platforms**: Blinkit, Zepto, etc.

### 3. Flight Agent
- **Purpose**: Find optimal flight bookings with credit card benefits
- **Capabilities**: Route optimization, timing analysis, credit card perks
- **Supported Platforms**: Google Flights, MakeMyTrip, etc.

## Credit Card Integration

The system includes a comprehensive database of Indian credit cards with:
- Bank and card details
- Reward programs and cashback rates
- Lounge access and travel benefits
- Annual fees and joining offers

**Example Cards**:
- HDFC Bank Millennia (5% cashback on major platforms)
- SBI SimplyCLICK (10X rewards on online shopping)
- Axis Bank ACE (5% cashback on bill payments)

## Tools and Utilities

### Intent Classification
- AI-powered query understanding
- Automatic domain detection
- Parameter extraction

### Data Parsing
- Price extraction from text
- Weight/quantity parsing
- Text normalization

### Response Validation
- Data structure validation
- JSON serialization safety
- Error handling

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `ENVIRONMENT` | Environment (dev/prod) | development |
| `HOST` | Server host | 0.0.0.0 |
| `PORT` | Server port | 8000 |

### Development vs Production

**Development**:
- Auto-reload enabled
- Detailed logging
- CORS allows all origins

**Production**:
- Auto-reload disabled
- Minimal logging
- Restricted CORS origins

## Error Handling

The system includes comprehensive error handling:
- HTTP status codes for different error types
- Detailed error messages with error IDs
- Graceful fallbacks for AI failures
- Input validation and sanitization

## Logging

Structured logging with different levels:
- **INFO**: Normal operations and requests
- **WARNING**: Non-critical issues
- **ERROR**: Errors and exceptions
- **DEBUG**: Detailed debugging information

## Performance

- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Caching**: Session and response caching
- **Rate Limiting**: Built-in request throttling

## Security

- **Input Validation**: Pydantic models for request validation
- **CORS Configuration**: Configurable cross-origin policies
- **Error Sanitization**: Safe error message handling
- **Session Management**: Secure session handling

## Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test query"}'
```

### Automated Testing
```bash
# Run tests (when implemented)
pytest tests/
```

## Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Traditional Server
```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Monitoring

### Health Checks
- `/health` endpoint for system status
- Agent availability monitoring
- Tool status checking

### Metrics
- Request/response times
- Error rates
- Agent performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the health endpoint for system status

## Roadmap

- [ ] Real-time scraping integration
- [ ] Advanced credit card recommendations
- [ ] Multi-language support
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Machine learning model training
