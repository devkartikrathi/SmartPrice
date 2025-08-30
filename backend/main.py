"""
Complete main.py - ADK E-commerce Orchestrator
Conversational AI orchestrator for product search, grocery shopping, and flight booking
"""

import os
import json
import logging
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from tools import (
    classify_query_intent_tool,
    scrape_products_tool,
    scrape_flights_tool,
    scrape_groceries_tool,
    analyze_product_prices_tool,
    analyze_grocery_prices_tool,
    recommend_credit_cards_tool
)
from agents import (
    get_agent_by_domain, 
    route_query_to_agent, 
    get_agent_capabilities,
    DOMAIN_AGENTS,
    product_agent,
    grocery_agent,
    flight_agent
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app setup
app = FastAPI(
    title="ADK E-commerce Orchestrator",
    description="Conversational AI orchestrator for product search, grocery shopping, and flight booking",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global session management
session_service = InMemorySessionService()
runners = {}
orchestrator_instance = None

# Request/Response Models
class ChatRequest(BaseModel):
    """Simplified chat-based request model"""
    query: str = Field(..., description="Natural language query", min_length=2, max_length=500)
    credit_card: Optional[str] = Field(default=None, description="User's preferred credit card")
    session_id: Optional[str] = Field(default=None, description="Session ID for conversation continuity")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context from previous interactions")
    
    @field_validator('query')
    @classmethod
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()

class ChatResponse(BaseModel):
    """Conversational response model"""
    conversation_id: str = Field(description="Unique conversation ID")
    timestamp: datetime = Field(description="Response timestamp")
    message: str = Field(description="Conversational response message")
    intent: str = Field(description="Detected user intent")
    agent_used: str = Field(description="Which agent handled the query")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Structured data (products, flights, etc.)")
    follow_up_questions: Optional[List[str]] = Field(default=None, description="Questions to clarify missing information")
    actions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Suggested actions (purchase, compare, etc.)")
    status: str = Field(default="success", description="Response status")
    error: Optional[str] = Field(default=None, description="Error message if any")

class OrchestratorAgent:
    """Main orchestrator that manages conversation flow and agent delegation"""
    
    def __init__(self):
        self.session_service = session_service
        
    async def process_conversation(self, request: ChatRequest) -> ChatResponse:
        """Main conversation processing pipeline"""
        conversation_id = request.session_id or str(uuid.uuid4())
        
        try:
            logger.info(f"Processing conversation [{conversation_id}]: {request.query}")
            
            # Step 1: Intent Classification
            intent_result = await classify_query_intent_tool(request.query)
            intent = intent_result.get('intent', 'general_question')
            confidence = intent_result.get('confidence', 0.0)
            
            logger.info(f"Intent detected: {intent} (confidence: {confidence})")
            
            # Step 2: Check for Missing Parameters
            missing_params = intent_result.get('missing_params', [])
            clarifying_questions = intent_result.get('clarifying_questions', [])
            
            if missing_params and confidence > 0.7:
                return ChatResponse(
                    conversation_id=conversation_id,
                    timestamp=datetime.now(),
                    message=f"I'd be happy to help you with that! {' '.join(clarifying_questions)}",
                    intent=intent,
                    agent_used="orchestrator",
                    follow_up_questions=clarifying_questions,
                    status="needs_clarification"
                )
            
            # Step 3: Route to Appropriate Agent
            domain = await route_query_to_agent(request.query, intent_result)
            logger.info(f"Routing to {domain} agent")
            
            if domain not in runners:
                raise HTTPException(status_code=500, detail=f"Agent runner for {domain} not available")
            
            # Step 4: Execute Agent with fallback to direct tool execution
            try:
                runner = runners[domain]
                agent_response = await self._execute_agent(
                    runner, conversation_id, request.query, request.credit_card, intent_result
                )
            except Exception as agent_error:
                logger.warning(f"Agent execution failed, using direct tool execution: {agent_error}")
                agent_response = await self._execute_direct_tools(
                    domain, request.query, request.credit_card, intent_result
                )
            
            # Step 5: Format Response
            return self._format_response(
                conversation_id, agent_response, intent, domain, request.query
            )
            
        except Exception as e:
            logger.error(f"Orchestrator error [{conversation_id}]: {e}")
            return ChatResponse(
                conversation_id=conversation_id,
                timestamp=datetime.now(),
                message="I apologize, but I encountered an error processing your request. Please try again or rephrase your query.",
                intent="error",
                agent_used="orchestrator",
                status="error",
                error=str(e)
            )
    
    async def _execute_agent(
        self, 
        runner: Runner, 
        session_id: str, 
        query: str, 
        credit_card: Optional[str],
        intent_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute the appropriate domain agent"""
        
        # Prepare enhanced query with credit card info
        enhanced_query = query
        if credit_card:
            enhanced_query += f"\nUser's preferred credit card: {credit_card}"
        
        # Add extracted parameters to query
        extracted_params = intent_result.get('extracted_params', {})
        if extracted_params:
            enhanced_query += f"\nExtracted parameters: {json.dumps(extracted_params)}"
        
        user_content = types.Content(role='user', parts=[types.Part(text=enhanced_query)])
        
        # Execute agent
        events = []
        final_response = None
        
        async for event in runner.run_async(
            user_id="user", 
            session_id=session_id, 
            new_message=user_content
        ):
            events.append(event)
            if event.is_final_response() and event.content:
                final_response = event.content.parts[0].text if event.content.parts else ""
        
        # Parse agent response
        try:
            if final_response:
                response_data = json.loads(final_response)
                return response_data
        except json.JSONDecodeError:
            # Fallback: treat as plain text response
            return {"summary": final_response, "raw_response": final_response}
        
        return {"summary": "Agent completed successfully", "events": len(events)}
    
    async def _execute_direct_tools(
        self,
        domain: str,
        query: str,
        credit_card: Optional[str],
        intent_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Direct tool execution when agent fails"""
        try:
            extracted_params = intent_result.get('extracted_params', {})
            
            if domain == 'product':
                # Execute product scraping and analysis
                product_name = extracted_params.get('product_name', query)
                
                # Scrape products
                scrape_result = await scrape_products_tool(
                    query=product_name,
                    max_products=5,
                    platforms=["amazon", "flipkart"]
                )
                
                products = scrape_result.products if hasattr(scrape_result, 'products') else []
                
                if products and credit_card:
                    # Analyze prices
                    analysis_result = await analyze_product_prices_tool(
                        products=products,
                        user_credit_cards=[credit_card]
                    )
                    analyzed_products = analysis_result.get('analyzed_products', products)
                else:
                    analyzed_products = products
                
                return {
                    'summary': f"I found {len(analyzed_products)} products for '{product_name}'. Here are the best options with pricing analysis.",
                    'products': analyzed_products[:5],  # Limit to top 5
                    'best_deal': analyzed_products[0] if analyzed_products else None,
                    'total_products': len(analyzed_products),
                    'next_steps': ["Compare detailed specifications", "Check delivery options", "Proceed to purchase"]
                }
                
            elif domain == 'grocery':
                # Execute grocery scraping and analysis
                grocery_result = await analyze_grocery_prices_tool(
                    grocery_query=query,
                    user_credit_cards=[credit_card] if credit_card else ["No Card"],
                    scraped_data=None
                )
                
                return {
                    'summary': f"I found grocery options for your request. Here's an optimized shopping list with the best prices.",
                    'grocery_items': grocery_result.get('grocery_items', []),
                    'cart': grocery_result.get('cart', []),
                    'total_savings': grocery_result.get('total_savings', 0.0),
                    'platform_recommendation': 'Blinkit',  # Default recommendation
                    'next_steps': ["Review cart items", "Confirm delivery address", "Proceed to checkout"]
                }
                
            elif domain == 'flight':
                # Execute flight scraping
                departure = extracted_params.get('departure', 'Delhi')
                arrival = extracted_params.get('arrival', 'Mumbai')
                date = extracted_params.get('date', '2024-02-15')
                
                flight_result = await scrape_flights_tool(
                    departure_airport=departure,
                    arrival_airport=arrival,
                    departure_date=date,
                    max_flights=10
                )
                
                flights = flight_result.flights if hasattr(flight_result, 'flights') else []
                
                return {
                    'summary': f"I found {len(flights)} flight options from {departure} to {arrival}. Here are the best options based on price and convenience.",
                    'flights': flights[:5],  # Limit to top 5
                    'best_option': flights[0] if flights else None,
                    'price_trends': "Prices are moderate for this route. Booking 2-3 weeks in advance typically offers better deals.",
                    'booking_advice': ["Compare airline policies", "Check baggage allowances", "Consider travel insurance"],
                    'next_steps': ["Select preferred flight", "Review booking terms", "Proceed to booking"]
                }
            
            else:
                return {
                    'summary': f"I understand you're looking for help with {query}. Let me search for the best options.",
                    'error': f'Direct tool execution not implemented for domain: {domain}'
                }
                
        except Exception as e:
            logger.error(f"Direct tool execution failed: {e}")
            return {
                'summary': f"I encountered an issue while processing your request for {query}. Please try rephrasing your query.",
                'error': str(e)
            }
    
    def _format_response(
        self,
        conversation_id: str,
        agent_response: Dict[str, Any],
        intent: str,
        domain: str,
        original_query: str
    ) -> ChatResponse:
        """Format agent response into conversational format"""
        
        # Extract conversational message
        message = agent_response.get('summary', 'I found some results for your query.')
        
        # Extract structured data
        data = {}
        if 'products' in agent_response:
            data['products'] = agent_response['products']
        if 'flights' in agent_response:
            data['flights'] = agent_response['flights']
        if 'grocery_items' in agent_response:
            data['grocery_items'] = agent_response['grocery_items']
        if 'cart' in agent_response:
            data['cart'] = agent_response['cart']
        if 'total_savings' in agent_response:
            data['total_savings'] = agent_response['total_savings']
        
        # Extract actions
        actions = []
        if agent_response.get('best_deal'):
            actions.append({
                'type': 'purchase',
                'description': 'Purchase recommended product',
                'data': agent_response['best_deal']
            })
        
        if agent_response.get('best_option'):
            actions.append({
                'type': 'book',
                'description': 'Book recommended flight',
                'data': agent_response['best_option']
            })
        
        next_steps = agent_response.get('next_steps', [])
        for step in next_steps:
            actions.append({
                'type': 'suggestion',
                'description': step
            })
        
        return ChatResponse(
            conversation_id=conversation_id,
            timestamp=datetime.now(),
            message=message,
            intent=intent,
            agent_used=domain,
            data=data if data else None,
            actions=actions if actions else None,
            status="success" if not agent_response.get('error') else "error",
            error=agent_response.get('error')
        )

def initialize_agent_runners():
    """Initialize ADK runners for each domain agent"""
    global runners
    
    for domain, agent in DOMAIN_AGENTS.items():
        try:
            runner = Runner(
                agent=agent,
                app_name="ecommerce_orchestrator",
                session_service=session_service
            )
            runners[domain] = runner
            logger.info(f"Initialized runner for {domain} agent")
        except Exception as e:
            logger.warning(f"Failed to initialize runner for {domain}: {e}")
            # Continue without this runner - direct tool execution will be used as fallback

# Initialize orchestrator
orchestrator_instance = OrchestratorAgent()

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting ADK E-commerce Orchestrator...")
    initialize_agent_runners()
    logger.info("Orchestrator ready!")

@app.get("/")
async def root():
    return {
        "name": "ADK E-commerce Orchestrator",
        "version": "4.0.0",
        "description": "Conversational AI for product search, grocery shopping, and flight booking",
        "status": "active",
        "architecture": "Agent Development Kit (ADK)",
        "capabilities": get_agent_capabilities(),
        "endpoints": {
            "chat": "/chat",
            "health": "/health",
            "capabilities": "/capabilities",
            "test": "/test-agent/{domain}"
        }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main conversational endpoint"""
    if orchestrator_instance is None:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")
    
    return await orchestrator_instance.process_conversation(request)

@app.get("/health")
async def health_check():
    """Health check with ADK system status"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "4.0.0",
            "architecture": "Google ADK",
            "environment": {
                "gemini_api_configured": bool(os.getenv("GEMINI_API_KEY")),
                "firecrawl_api_configured": bool(os.getenv("FIRECRAWL_API_KEY"))
            },
            "agents": {},
            "runners": {},
            "tools": {
                "scraping_tools": ["scrape_products", "scrape_flights", "scrape_groceries"],
                "analysis_tools": ["analyze_product_prices", "analyze_grocery_prices"],
                "utility_tools": ["classify_query_intent", "recommend_credit_cards"]
            }
        }
        
        # Check agent status
        for domain, agent in DOMAIN_AGENTS.items():
            health_status["agents"][domain] = {
                "name": agent.name,
                "model": agent.model,
                "tools_count": len(agent.tools) if agent.tools else 0,
                "status": "active"
            }
        
        # Check runner status
        for domain, runner in runners.items():
            try:
                health_status["runners"][domain] = {
                    "status": "ready",
                    "app_name": getattr(runner, 'app_name', 'unknown')
                }
            except Exception as e:
                health_status["runners"][domain] = {
                    "status": "error",
                    "error": str(e)
                }
        
        # Add missing runners as fallback available
        for domain in DOMAIN_AGENTS.keys():
            if domain not in health_status["runners"]:
                health_status["runners"][domain] = {
                    "status": "fallback",
                    "note": "Using direct tool execution"
                }
        
        # Overall health assessment
        all_runners_healthy = all(
            runner_info.get("status") in ["ready", "fallback"] 
            for runner_info in health_status["runners"].values()
        )
        
        if not all_runners_healthy:
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@app.get("/capabilities")
async def get_capabilities():
    """Get system capabilities and supported domains"""
    return {
        "domains": get_agent_capabilities(),
        "supported_queries": {
            "product_search": [
                "I want to buy an iPhone 15",
                "Find me the best laptop under 50000",
                "Compare prices for Samsung Galaxy S24",
                "Show me gaming headphones",
                "I need a smartphone with good camera"
            ],
            "grocery_search": [
                "I need milk and bread",
                "Find organic vegetables near me",
                "Compare grocery prices for weekly shopping",
                "I want fresh fruits delivered today",
                "Show me breakfast items"
            ],
            "flight_search": [
                "I want to fly from Delhi to Mumbai",
                "Find cheap flights to Goa next week",
                "Book a round trip to Bangalore",
                "Show flights from BOM to DEL",
                "I need to travel to Chennai tomorrow"
            ]
        },
        "credit_cards_supported": True,
        "platforms": {
            "products": ["Amazon", "Flipkart"],
            "groceries": ["Blinkit", "Zepto"],
            "flights": ["Google Flights", "MakeMyTrip"]
        },
        "features": [
            "Natural language processing",
            "Intent classification",
            "Multi-platform price comparison",
            "Credit card optimization",
            "Real-time scraping",
            "Conversational responses"
        ]
    }

@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get session information and history"""
    try:
        return {
            "session_id": session_id,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "message_count": 0,  # Placeholder - would need session tracking implementation
            "last_activity": datetime.now().isoformat(),
            "note": "Session history tracking requires additional implementation with ADK session management"
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found: {e}")

@app.post("/test-agent/{domain}")
async def test_agent(domain: str, query: str = "test query"):
    """Test endpoint for individual agents"""
    if domain not in DOMAIN_AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent for domain '{domain}' not found")
    
    try:
        test_request = ChatRequest(query=query, credit_card="HDFC Bank Millennia")
        
        if domain in runners:
            # Test with ADK runner
            runner = runners[domain]
            session_id = str(uuid.uuid4())
            
            user_content = types.Content(role='user', parts=[types.Part(text=query)])
            
            events = []
            final_response = None
            
            async for event in runner.run_async(
                user_id="test_user",
                session_id=session_id,
                new_message=user_content
            ):
                events.append({
                    "type": getattr(event, 'type', 'unknown'),
                    "author": getattr(event, 'author', 'unknown'),
                    "timestamp": datetime.now().isoformat()
                })
                if event.is_final_response() and event.content:
                    final_response = event.content.parts[0].text if event.content.parts else ""
            
            return {
                "domain": domain,
                "query": query,
                "method": "adk_runner",
                "events_count": len(events),
                "final_response": final_response,
                "status": "completed",
                "events": events[-5:] if len(events) > 5 else events  # Last 5 events
            }
        else:
            # Test with direct tool execution
            intent_result = await classify_query_intent_tool(query)
            result = await orchestrator_instance._execute_direct_tools(
                domain, query, "HDFC Bank Millennia", intent_result
            )
            
            return {
                "domain": domain,
                "query": query,
                "method": "direct_tools",
                "result": result,
                "status": "completed"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent test failed: {e}")

@app.get("/tools")
async def get_available_tools():
    """Get list of available tools and their descriptions"""
    return {
        "scraping_tools": {
            "scrape_products": "Scrape product information from e-commerce platforms",
            "scrape_flights": "Scrape flight information from booking platforms", 
            "scrape_groceries": "Scrape grocery products from quick commerce platforms"
        },
        "analysis_tools": {
            "analyze_product_prices": "Analyze product prices and calculate credit card benefits",
            "analyze_grocery_prices": "Analyze grocery prices with unit pricing optimization"
        },
        "utility_tools": {
            "classify_query_intent": "Classify user query intent using AI",
            "recommend_credit_cards": "Recommend optimal credit card usage for purchases"
        },
        "total_tools": 6
    }

# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    error_id = str(uuid.uuid4())
    logger.error(f"Unhandled exception [{error_id}]: {str(exc)}")
    
    return {
        "error_id": error_id,
        "message": "An unexpected error occurred",
        "error": str(exc),
        "timestamp": datetime.now().isoformat(),
        "support": "Check /health endpoint for system status"
    }

@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests"""
    start_time = datetime.now()
    
    response = await call_next(request)
    
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {process_time:.3f}s"
    )
    
    return response

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENVIRONMENT", "development") == "development"
    
    logger.info("=" * 60)
    logger.info("🚀 Starting ADK E-commerce Orchestrator")
    logger.info(f"📍 Server: http://{host}:{port}")
    logger.info(f"📖 API Documentation: http://localhost:{port}/docs")
    logger.info(f"🔍 Health Check: http://localhost:{port}/health")
    logger.info(f"🤖 Architecture: Google Agent Development Kit (ADK)")
    logger.info(f"🔄 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"🔑 Gemini API: {'✅ Configured' if os.getenv('GEMINI_API_KEY') else '❌ Missing'}")
    logger.info(f"🔧 Firecrawl API: {'✅ Configured' if os.getenv('FIRECRAWL_API_KEY') else '❌ Missing'}")
    logger.info("=" * 60)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
        access_log=True
    )