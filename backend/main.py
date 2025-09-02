import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Tuple
import json

from agents import (
    get_agent_by_domain,
    route_query_to_agent,
    get_agent_capabilities,
    list_available_agents
)
from tools import classify_query_intent_tool

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
from dotenv import load_dotenv
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set. AI features will be limited.")

# Pydantic models
class ChatRequest(BaseModel):
    query: str
    credit_card: Optional[str] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatRouteRequest(BaseModel):
    query: str
    userCards: List[str]

class OrchestratedResponse(BaseModel):
    agent: str
    bestCard: Optional[str] = None
    rationale: Optional[str] = None
    details: Dict[str, Any]

class OrchestratorService:
    """Service for orchestrating AI agents and managing conversations"""
    
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.conversation_history: Dict[str, List[Dict[str, Any]]] = {}
    
    async def process_chat(self, request: ChatRequest) -> Dict[str, Any]:
        """Process a chat request through the appropriate agent"""
        try:
            # Generate or retrieve session ID
            session_id = request.session_id or str(uuid.uuid4())
            
            # Initialize session if new
            if session_id not in self.sessions:
                self.sessions[session_id] = {
                    "created_at": datetime.now().isoformat(),
                    "credit_card": request.credit_card,
                    "context": request.context or {}
                }
                self.conversation_history[session_id] = []
            
            # Classify query intent
            intent_result = await classify_query_intent_tool(request.query)
            
            # Route to appropriate agent
            agent_result = await route_query_to_agent(
                query=request.query,
                credit_card=request.credit_card,
                extracted_params=intent_result.get('extracted_params', {})
            )
            
            # Store conversation history
            conversation_entry = {
                "timestamp": datetime.now().isoformat(),
                "query": request.query,
                "intent": intent_result.get('intent', 'general'),
                "agent_used": agent_result.get('domain', 'orchestrator'),
                "response": agent_result.get('summary', 'No response generated'),
                "data": agent_result.get('data', {})
            }
            self.conversation_history[session_id].append(conversation_entry)
            
            # Update session
            self.sessions[session_id]["last_activity"] = datetime.now().isoformat()
            self.sessions[session_id]["context"] = {
                **self.sessions[session_id]["context"],
                "last_intent": intent_result.get('intent'),
                "last_agent": agent_result.get('domain')
            }
            
            return {
                "conversation_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "message": agent_result.get('summary', 'I processed your request successfully.'),
                "intent": intent_result.get('intent', 'general'),
                "agent_used": agent_result.get('domain', 'orchestrator'),
                "data": agent_result.get('data', {}),
                "follow_up_questions": agent_result.get('next_steps', []),
                "actions": [],
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error processing chat: {e}")
            return {
                "conversation_id": request.session_id or str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "message": f"Sorry, I encountered an error: {str(e)}",
                "intent": "error",
                "agent_used": "orchestrator",
                "status": "error",
                "error": str(e)
            }

# Initialize orchestrator
orchestrator = OrchestratorService()

# FastAPI app setup
app = FastAPI(
    title="SmartPrice Assistant",
    description="AI-powered e-commerce and travel assistant with credit card optimization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_origin_regex=None,
    expose_headers=["*"],
    max_age=86400,
)

# In-memory session store
sessions = {}

# API Endpoints

@app.get("/")
async def root():
    return {
        "name": "SmartPrice Assistant",
        "version": "1.0.0",
        "description": "AI-powered e-commerce and travel assistant with credit card optimization",
        "status": "active",
        "capabilities": get_agent_capabilities(),
        "links": {
            "self": "/",
            "chat": "/chat",
            "health": "/health",
            "capabilities": "/capabilities",
            "tools": "/tools",
            "sessions": "/sessions/{session_id}"
        }
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    """Process a chat request and return AI-powered response"""
    try:
        result = await orchestrator.process_chat(request)
        return result
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _classify_agent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["flight", "fly", "book flight", "airport", "del ", "bom "]):
        return "flights"
    if any(w in q for w in ["grocery", "milk", "bread", "eggs", "vegetable", "fruits", "zepto", "blinkit"]):
        return "groceries"
    return "products"


def _parse_grocery_items(query: str) -> List[str]:
    q = query.lower()
    items = []
    for token in ["milk", "bread", "eggs", "egg", "butter", "cheese", "paneer", "curd", "yogurt", "rice", "atta", "flour"]:
        if token in q:
            # normalize plural
            items.append("eggs" if token == "egg" else token)
    if not items:
        # fallback split by commas
        items = [part.strip() for part in q.split(',') if part.strip()]
    return list(dict.fromkeys(items))


def _load_grocery_catalogs() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    try:
        with open(os.path.join(os.path.dirname(__file__), 'blinkit_data.json'), 'r', encoding='utf-8') as f:
            blinkit = json.load(f)
    except Exception:
        blinkit = {}
    try:
        with open(os.path.join(os.path.dirname(__file__), 'zepto_data.json'), 'r', encoding='utf-8') as f:
            zepto = json.load(f)
    except Exception:
        zepto = {}
    return blinkit, zepto


def _extract_grocery_items(catalog: Dict[str, Any], wanted: List[str], platform_name: str, max_per_item: int = 8) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for key in wanted:
        bucket = catalog.get(key) or catalog.get(key.lower()) or {}
        # common structures: {"data": {"products": [...]}} or deeply nested lists
        candidates: List[Dict[str, Any]] = []
        if isinstance(bucket, dict):
            if isinstance(bucket.get('data'), dict):
                for v in bucket['data'].values():
                    if isinstance(v, list):
                        candidates.extend([x for x in v if isinstance(x, dict)])
            elif isinstance(bucket.get('data'), list):
                candidates.extend([x for x in bucket['data'] if isinstance(x, dict)])
        if isinstance(bucket, list):
            candidates.extend([x for x in bucket if isinstance(x, dict)])

        extracted = []
        for item in candidates:
            title = item.get('title') or item.get('name') or item.get('listing_title')
            url = item.get('url') or item.get('product_url') or item.get('link')
            price = item.get('price') or item.get('final_price') or item.get('mrp')
            qty = item.get('pack') or item.get('qty') or item.get('weight')
            if not title:
                # look into nested
                li = item.get('listing_info')
                if isinstance(li, dict):
                    title = li.get('title')
                    url = url or li.get('url')
                    price = price or li.get('price') or li.get('price_str')
                di = item.get('detailed_info')
                if isinstance(di, dict):
                    qty = qty or di.get('weight') or di.get('pack')
            if not title:
                continue
            # best-effort price numeric
            try:
                if isinstance(price, str):
                    digits = ''.join(ch for ch in price if ch.isdigit() or ch == '.')
                    price_num = float(digits) if digits else None
                elif isinstance(price, (int, float)):
                    price_num = float(price)
                else:
                    price_num = None
            except Exception:
                price_num = None

            extracted.append({
                "title": title,
                "qty": qty or "",
                "price": price_num or 0.0,
                "url": url or "",
                "platform": platform_name
            })
            if len(extracted) >= max_per_item:
                break
        results.extend(extracted)
    return results


def _assemble_llm_prompt(user_query: str, user_cards: List[str], card_offers: List[Dict[str, Any]], domain_payload: Dict[str, Any], agent: str) -> str:
    return (
        "SYSTEM:\n"
        "You are a Chat Commerce Orchestrator. Return STRICT JSON only.\n\n"
        f"User query: {user_query}\n"
        f"userCards: {json.dumps(user_cards)}\n"
        f"cardOffers: {json.dumps(card_offers, ensure_ascii=False)}\n"
        f"agent: {agent}\n"
        f"domainData: {json.dumps(domain_payload, ensure_ascii=False)}\n\n"
        "Follow Response Schemas exactly as provided by the client."
    )


def _call_llm(prompt: str) -> Optional[Dict[str, Any]]:
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        from google import genai
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0.1}
        )
        return json.loads(resp.text)
    except Exception as e:
        logger.warning(f"LLM call failed: {e}")
        return None


@app.post("/chat/route", response_model=OrchestratedResponse)
async def chat_route(request: ChatRouteRequest):
    try:
        agent = _classify_agent(request.query)

        # Build domain payload
        domain_payload: Dict[str, Any] = {}
        if agent == "groceries":
            blinkit, zepto = _load_grocery_catalogs()
            items = _parse_grocery_items(request.query)
            blinkit_items = _extract_grocery_items(blinkit, items, "Blinkit")
            zepto_items = _extract_grocery_items(zepto, items, "Zepto")
            domain_payload = {
                "itemsRequested": items,
                "blinkit": blinkit_items,
                "zepto": zepto_items
            }
        elif agent == "products":
            # Placeholder scraping payload
            domain_payload = {
                "offers": [
                    {"platform": "Amazon", "title": request.query, "price": 0, "url": ""},
                    {"platform": "Flipkart", "title": request.query, "price": 0, "url": ""}
                ]
            }
        else:  # flights
            domain_payload = {
                "candidates": [
                    {"airline": "IndiGo", "price": 0, "depart": "", "arrive": "", "url": ""}
                ]
            }

        # Card offers dataset
        try:
            from agents import CREDIT_CARD_DATABASE
            card_offers = CREDIT_CARD_DATABASE
        except Exception:
            card_offers = []

        prompt = _assemble_llm_prompt(request.query, request.userCards, card_offers, domain_payload, agent)
        llm_result = _call_llm(prompt)

        if isinstance(llm_result, dict) and llm_result.get("agent"):
            return OrchestratedResponse(**llm_result)  # type: ignore[arg-type]

        # Fallback minimal response
        fallback_best = request.userCards[0] if request.userCards else None
        if agent == "groceries":
            blinkit_total = sum(x.get("price", 0) for x in domain_payload.get("blinkit", []))
            zepto_total = sum(x.get("price", 0) for x in domain_payload.get("zepto", []))
            chosen = "Blinkit" if blinkit_total <= zepto_total else "Zepto"
            return OrchestratedResponse(
                agent="groceries",
                bestCard=fallback_best or "",
                rationale="Fallback selection by subtotal only.",
                details={
                    "items": [
                        *[{"name": i.get("title", ""), "platform": "Blinkit", "price": i.get("price", 0), "url": i.get("url", "")} for i in domain_payload.get("blinkit", [])],
                        *[{"name": i.get("title", ""), "platform": "Zepto", "price": i.get("price", 0), "url": i.get("url", "")} for i in domain_payload.get("zepto", [])]
                    ],
                    "totals": {
                        "blinkit": {"mrp": blinkit_total, "effective": blinkit_total},
                        "zepto": {"mrp": zepto_total, "effective": zepto_total}
                    },
                    "chosenPlatform": chosen
                }
            )
        if agent == "products":
            return OrchestratedResponse(
                agent="products",
                bestCard=fallback_best or "",
                rationale="Fallback selection; scraping pending.",
                details={
                    "product": request.query,
                    "offers": domain_payload.get("offers", []),
                    "effectivePrices": [],
                    "winner": None
                }
            )
        return OrchestratedResponse(
            agent="flights",
            bestCard=fallback_best or "",
            rationale="Fallback selection; use LLM when configured.",
            details={
                "route": request.query,
                "date": None,
                "candidates": domain_payload.get("candidates", []),
                "effectiveByCard": [],
                "winner": None
            }
        )
    except Exception as e:
        logger.error(f"/chat/route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "architecture": "x86_64",
            "environment": {
                "production": os.getenv("ENVIRONMENT", "development") == "production",
                "development": os.getenv("ENVIRONMENT", "development") == "development"
            },
            "agents": {},
            "runners": {},
            "tools": {},
            "components": {
                "orchestrator": "active",
                "sessions": len(orchestrator.sessions)
            }
        }
        
        # Check tools status
        try:
            from tools import AVAILABLE_TOOLS
            for tool_name in AVAILABLE_TOOLS.keys():
                health_status["tools"][tool_name] = "available"
        except Exception as e:
            logger.warning(f"Could not check tools status: {e}")
            health_status["tools"] = {"error": "tools module not available"}
        
        # Check agents status
        try:
            available_agents = list_available_agents()
            for agent_name in available_agents:
                health_status["agents"][agent_name] = {"status": "active"}
        except Exception as e:
            logger.warning(f"Could not check agents status: {e}")
            health_status["agents"] = {"error": "agents module not available"}
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get information about a specific session"""
    try:
        if session_id not in orchestrator.sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = orchestrator.sessions[session_id]
        conversation_history = orchestrator.conversation_history.get(session_id, [])
        
        return {
            "session_id": session_id,
            "session_info": session,
            "conversation_count": len(conversation_history),
            "last_activity": session.get("last_activity"),
            "conversation_history": conversation_history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session info: {e}")

@app.get("/tools")
async def get_available_tools():
    """Get list of available tools and their descriptions"""
    try:
        from tools import AVAILABLE_TOOLS
        return {
            "scraping_tools": {
                "scrape_products": AVAILABLE_TOOLS.get("scrape_products", "Scrape product information from e-commerce platforms"),
                "scrape_flights": AVAILABLE_TOOLS.get("scrape_flights", "Scrape flight information and prices"),
                "scrape_groceries": AVAILABLE_TOOLS.get("scrape_groceries", "Scrape grocery prices and availability")
            },
            "analysis_tools": {
                "analyze_product_prices": AVAILABLE_TOOLS.get("analyze_product_prices", "Analyze and compare product prices"),
                "analyze_grocery_prices": AVAILABLE_TOOLS.get("analyze_grocery_prices", "Analyze grocery pricing and unit costs"),
                "recommend_credit_cards": AVAILABLE_TOOLS.get("recommend_credit_cards", "Recommend credit cards based on spending patterns")
            },
            "intent_classification": {
                "classify_query_intent": "Classify user queries into different domains (products, groceries, flights)"
            }
        }
    except Exception as e:
        logger.error(f"Error getting tools: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting tools: {e}")

@app.get("/credit-cards")
async def get_credit_cards():
    """Get all available credit cards for frontend selection"""
    try:
        from agents import CREDIT_CARD_DATABASE

        # Format the credit card data for frontend consumption
        formatted_cards = []
        for card in CREDIT_CARD_DATABASE:
            formatted_cards.append({
                "id": f"{card['Bank'].replace(' ', '_')}_{card['Card Name'].replace(' ', '_')}",
                "bank": card['Bank'],
                "card_name": card['Card Name'],
                "key_features": card['Key Features/Benefits'],
                "joining_fee": card['Joining Fee (INR/AED)'],
                "annual_fee": card['Annual Fee (INR/AED)'],
                "welcome_offer": card['Welcome Offer'],
                "rewards_program": card['Rewards Program'],
                "lounge_access": card['Lounge Access'],
                "other_benefits": card['Other Benefits'],
                "display_name": f"{card['Bank']} {card['Card Name']}"
            })

        return {
            "status": "success",
            "total_cards": len(formatted_cards),
            "credit_cards": formatted_cards
        }

    except Exception as e:
        logger.error(f"Error fetching credit cards: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to fetch credit card data",
                "error": str(e)
            }
        )

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return {"error": exc.detail, "status_code": exc.status_code}

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return {"error": "Internal server error", "status_code": 500}

# Main entry point
if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    host = "0.0.0.0"
    port = int(os.getenv("PORT", 8000))
    # Start server
    uvicorn.run(app, host=host, port=port, reload="development")
    
    logger.info("=" * 60)
    logger.info("🚀 Starting SmartPrice Assistant")
    logger.info(f"📍 Server: http://{host}:{port}")
    logger.info(f"📖 API Documentation: http://localhost:{port}/docs")
