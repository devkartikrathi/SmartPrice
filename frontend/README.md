# SmartPrice Frontend

A modern, AI-powered e-commerce frontend built with Next.js, TypeScript, and Tailwind CSS. This frontend integrates with the SmartPrice backend to provide intelligent product search, flight booking, and grocery optimization.

## Features

- 🤖 **AI-Powered Chat Interface** - Natural language product search and recommendations
- 🛒 **Smart Shopping Cart** - Multi-platform product management
- 💳 **Credit Card Optimization** - Get the best deals with your preferred cards
- ✈️ **Flight Search** - Intelligent flight booking assistance
- 🥬 **Grocery Optimization** - Smart grocery shopping with price comparison
- 🎨 **Modern UI/UX** - Beautiful, responsive design with dark/light themes
- 📱 **Mobile-First** - Optimized for all device sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand with persistence
- **UI Components**: Radix UI primitives with custom styling
- **Authentication**: Clerk (optional)
- **Backend**: SmartPrice (FastAPI + Google ADK)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see backend setup)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the root directory:
   ```env
   # Backend API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # Clerk Authentication (optional)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
   CLERK_SECRET_KEY=your_secret_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Backend Integration

This frontend is designed to work with the SmartPrice backend. The backend provides:

- **Intent Classification**: AI-powered query understanding
- **Multi-Domain Agents**: Specialized agents for products, flights, and groceries
- **Real-time Scraping**: Live price data from multiple platforms
- **Credit Card Optimization**: Smart recommendations for payment methods
- **Conversational AI**: Natural language processing and responses

### API Endpoints

- `POST /chat` - Main conversational endpoint
- `GET /health` - System health status
- `GET /capabilities` - Available features and domains
- `GET /tools` - Available tools and functions
- `POST /test-agent/{domain}` - Test specific domain agents

## Project Structure

```
fe/
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
│   ├── chat/             # Chat interface components
│   ├── cart/             # Shopping cart components
│   ├── grocery/          # Grocery-specific components
│   ├── flights/          # Flight search components
│   ├── layout/           # Layout and navigation
│   └── ui/               # Base UI components
├── lib/                   # Utilities and configurations
│   ├── api.ts            # API client and types
│   ├── store.ts          # Zustand state management
│   └── utils.ts          # Helper functions
└── public/                # Static assets
```

## Key Components

### Chat Interface
The main AI assistant interface that handles:
- Natural language queries
- Intent classification
- Multi-domain responses
- Follow-up questions
- Action suggestions

### Credit Card Selector
Allows users to set their preferred credit card for:
- Better deal recommendations
- Cashback optimization
- Platform-specific benefits

### Shopping Cart
Smart cart management with:
- Multi-platform product grouping
- Quantity management
- Price optimization
- Platform-specific checkout

## Development

### Adding New Features
1. Create components in the appropriate directory
2. Update the store if state management is needed
3. Add API endpoints to `lib/api.ts`
4. Update types and interfaces as needed

### Styling
- Use Tailwind CSS utility classes
- Create custom components in `components/ui/`
- Follow the existing design system
- Ensure responsive design

### State Management
- Use Zustand for global state
- Keep components focused and composable
- Use React Query for server state when appropriate

## Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

3. **Environment Variables**: Ensure all required environment variables are set in production

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Check if the backend server is running
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend health endpoint

2. **Authentication Issues**:
   - Verify Clerk configuration
   - Check environment variables
   - Ensure proper redirect URLs

3. **Build Errors**:
   - Clear `.next` directory
   - Reinstall dependencies
   - Check TypeScript errors

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=smartprice:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the backend documentation
- Review the API endpoints
- Check the health status endpoint
- Review the console for error messages
