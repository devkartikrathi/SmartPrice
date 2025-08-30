"""
Domain-specific agents using simplified tool integration
Self-contained agents without external dependencies
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional

from tools import (
    scrape_products_tool, 
    scrape_flights_tool, 
    scrape_groceries_tool,
    analyze_product_prices_tool,
    analyze_grocery_prices_tool,
    recommend_credit_cards_tool,
    extract_price_from_text
)

logger = logging.getLogger(__name__)

class SimpleAgent:
    """Simplified agent class without external dependencies"""
    
    def __init__(self, name: str, description: str, instruction: str, tools: List[str]):
        self.name = name
        self.description = description
        self.instruction = instruction
        self.available_tools = tools
        self.model = "simple-agent"  # Placeholder for compatibility
    
    async def process_query(self, query: str, credit_card: Optional[str] = None, extracted_params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process query using available tools"""
        try:
            logger.info(f"{self.name} processing query: {query}")
            
            if extracted_params is None:
                extracted_params = {}
            
            if self.name == "product_agent":
                return await self._process_product_query(query, credit_card, extracted_params)
            elif self.name == "grocery_agent":
                return await self._process_grocery_query(query, credit_card, extracted_params)
            elif self.name == "flight_agent":
                return await self._process_flight_query(query, credit_card, extracted_params)
            else:
                return {"error": f"Unknown agent: {self.name}", "summary": "Agent not recognized"}
                
        except Exception as e:
            logger.error(f"{self.name} processing error: {e}")
            return {"error": str(e), "summary": f"Failed to process query with {self.name}"}
    
    async def _process_product_query(self, query: str, credit_card: Optional[str], extracted_params: Dict[str, Any]) -> Dict[str, Any]:
        """Process product-related queries"""
        try:
            product_name = extracted_params.get('product_name', query)
            
            # Scrape products
            logger.info(f"Scraping products for: {product_name}")
            scrape_result = await scrape_products_tool(query=product_name, max_products=5)
            products = scrape_result.products
            
            if not products:
                return {
                    "summary": f"I couldn't find any products matching '{product_name}'. Try different keywords or check the spelling.",
                    "products": [],
                    "best_deal": None,
                    "total_savings": 0.0,
                    "next_steps": [
                        "Try alternative product names",
                        "Check different categories",
                        "Use more general search terms"
                    ]
                }
            
            # Analyze prices if credit card provided
            analyzed_products = []
            if credit_card:
                logger.info(f"Analyzing prices with credit card: {credit_card}")
                # Extract listing info for analysis
                product_listings = []
                for p in products:
                    listing = p.get('listing_info', p)
                    product_listings.append(listing)
                
                analysis_result = await analyze_product_prices_tool(
                    products=product_listings,
                    user_credit_cards=[credit_card]
                )
                analyzed_products = analysis_result.get('analyzed_products', [])
            else:
                # Convert products to analyzed format without credit card benefits
                for p in products:
                    listing = p.get('listing_info', p)
                    price = extract_price_from_text(listing.get('price_str', '₹0'))
                    
                    analyzed_products.append({
                        'product_title': listing.get('title', 'Unknown Product'),
                        'product_url': listing.get('url', ''),
                        'platform': listing.get('platform', 'Unknown'),
                        'original_price': price,
                        'effective_price': price,
                        'total_discount': 0.0,
                        'savings_percentage': 0.0,
                        'recommended_card': 'No Card',
                        'card_benefit_description': 'No card benefits applied'
                    })
            
            if not analyzed_products:
                return {
                    "summary": f"Found products for '{product_name}' but couldn't analyze pricing. Please try again.",
                    "products": [],
                    "best_deal": None,
                    "error": "Price analysis failed"
                }
            
            # Sort by effective price (lowest first)
            analyzed_products.sort(key=lambda x: x.get('effective_price', float('inf')))
            
            best_deal = analyzed_products[0]
            total_savings = sum(p.get('total_discount', 0) for p in analyzed_products)
            
            # Create summary message
            summary = f"I found {len(analyzed_products)} products for '{product_name}'. "
            if best_deal:
                best_price = best_deal.get('effective_price', 0)
                best_title = best_deal.get('product_title', 'a product')
                platform = best_deal.get('platform', 'unknown platform')
                summary += f"The best deal is **{best_title}** on {platform} for ₹{best_price:,.0f}"
                
                if credit_card and best_deal.get('total_discount', 0) > 0:
                    savings = best_deal.get('total_discount', 0)
                    summary += f" (saving ₹{savings:,.0f} with your {credit_card})"
                summary += "."
            
            return {
                "summary": summary,
                "products": analyzed_products,
                "best_deal": best_deal,
                "total_savings": total_savings,
                "platforms_searched": scrape_result.platforms_scraped,
                "next_steps": [
                    "Compare product specifications",
                    "Check delivery options and timeline", 
                    "Read customer reviews",
                    "Verify warranty and return policy",
                    "Proceed to purchase"
                ]
            }
            
        except Exception as e:
            logger.error(f"Product query processing error: {e}")
            return {
                "summary": f"I encountered an issue while searching for '{query}'. Please try again or rephrase your query.",
                "products": [],
                "error": str(e)
            }
    
    async def _process_grocery_query(self, query: str, credit_card: Optional[str], extracted_params: Dict[str, Any]) -> Dict[str, Any]:
        """Process grocery-related queries"""
        try:
            items = extracted_params.get('items', [query])
            
            logger.info(f"Processing grocery query for items: {items}")
            
            # Analyze groceries using the comprehensive tool
            result = await analyze_grocery_prices_tool(
                grocery_query=query,
                user_credit_cards=[credit_card] if credit_card else ["No Card"]
            )
            
            products = result.get('products', [])
            grocery_items = result.get('grocery_items', [])
            cart = result.get('cart', [])
            total_savings = result.get('total_savings', 0.0)
            
            if not products and not grocery_items:
                return {
                    "summary": f"I couldn't find grocery items for '{query}'. Please try specific product names like 'milk', 'bread', or 'vegetables'.",
                    "grocery_items": [],
                    "cart": [],
                    "products": [],
                    "total_savings": 0.0,
                    "next_steps": [
                        "Try specific product names (milk, bread, etc.)",
                        "Check if the items are available in your area",
                        "Try different platforms (Blinkit, Zepto)"
                    ]
                }
            
            # Create summary message
            summary = f"I found grocery options for '{query}'. "
            
            if cart and len(cart) > 0:
                total_items = len(cart)
                total_cost = sum(item.get('total_quantity_price', 0) for item in cart)
                summary += f"I've optimized a shopping cart with {total_items} item{'s' if total_items > 1 else ''} "
                summary += f"for ₹{total_cost:,.0f}"
                
                if total_savings > 0:
                    summary += f", saving you ₹{total_savings:,.0f}"
                    if credit_card:
                        summary += f" with your {credit_card}"
                summary += ". "
                
                # Add platform info
                platforms = list(set(item.get('platform', 'Unknown') for item in cart))
                if platforms:
                    summary += f"Best options found on: {', '.join(platforms)}."
            
            elif products:
                summary += f"Found {len(products)} product options across different platforms for price comparison."
            
            return {
                "summary": summary,
                "grocery_items": grocery_items,
                "cart": cart,
                "products": products,
                "total_savings": total_savings,
                "platform_recommendation": self._get_best_grocery_platform(cart),
                "next_steps": [
                    "Review cart items and quantities",
                    "Confirm delivery address and timing",
                    "Check minimum order requirements",
                    "Apply any available coupons",
                    "Proceed to checkout"
                ]
            }
            
        except Exception as e:
            logger.error(f"Grocery query processing error: {e}")
            return {
                "summary": f"I encountered an issue while searching for groceries. Please try again with specific item names.",
                "error": str(e),
                "grocery_items": [],
                "cart": []
            }
    
    async def _process_flight_query(self, query: str, credit_card: Optional[str], extracted_params: Dict[str, Any]) -> Dict[str, Any]:
        """Process flight-related queries"""
        try:
            # Extract flight parameters
            departure = extracted_params.get('departure', self._extract_airport_from_query(query, 'departure'))
            arrival = extracted_params.get('arrival', self._extract_airport_from_query(query, 'arrival'))
            
            # Use defaults if extraction failed
            if not departure:
                departure = "DEL"  # Default to Delhi
            if not arrival:
                arrival = "BOM"    # Default to Mumbai
            
            departure_date = extracted_params.get('date', "2024-03-15")  # Default date
            
            logger.info(f"Searching flights from {departure} to {arrival} on {departure_date}")
            
            # Scrape flights
            scrape_result = await scrape_flights_tool(
                departure_airport=departure,
                arrival_airport=arrival,
                departure_date=departure_date,
                max_flights=8
            )
            
            flights = scrape_result.flights
            
            if not flights:
                return {
                    "summary": f"I couldn't find flights from {departure} to {arrival}. Please specify clear departure and arrival cities.",
                    "flights": [],
                    "best_option": None,
                    "route_info": f"{departure} → {arrival}",
                    "next_steps": [
                        "Verify airport codes or city names",
                        "Try alternative nearby airports",
                        "Check if the route is available",
                        "Consider different travel dates"
                    ]
                }
            
            # Sort flights by price (lowest first)
            def get_flight_price(flight):
                flight_info = flight.get('listing_info', flight)
                price_str = flight_info.get('price_str', '₹0')
                return extract_price_from_text(price_str)
            
            flights_sorted = sorted(flights, key=get_flight_price)
            
            # Process flights for better presentation
            processed_flights = []
            for flight in flights_sorted:
                flight_info = flight.get('listing_info', flight)
                price = get_flight_price(flight)
                
                processed_flight = {
                    'airline': flight_info.get('airline', 'Unknown Airline'),
                    'price': price,
                    'price_str': flight_info.get('price_str', f'₹{price:,.0f}'),
                    'departure_time': flight_info.get('departure_time', 'N/A'),
                    'arrival_time': flight_info.get('arrival_time', 'N/A'),
                    'duration': flight_info.get('duration', 'N/A'),
                    'stops': flight_info.get('stops', '0'),
                    'platform': flight_info.get('platform', 'Unknown'),
                    'url': flight_info.get('url', '')
                }
                processed_flights.append(processed_flight)
            
            best_option = processed_flights[0] if processed_flights else None
            
            # Create summary message
            route_name = self._get_route_name(departure, arrival)
            summary = f"I found {len(processed_flights)} flights from {route_name}. "
            
            if best_option:
                airline = best_option['airline']
                price = best_option['price_str']
                departure_time = best_option['departure_time']
                duration = best_option['duration']
                stops = best_option['stops']
                
                summary += f"The best option is **{airline}** departing at {departure_time} "
                summary += f"for {price} ({duration}, {stops} stop{'s' if stops != '0' and stops != '1' else '' if stops == '1' else 's'})."
                
                if credit_card:
                    summary += f" You can earn additional rewards using your {credit_card} for booking."
            
            return {
                "summary": summary,
                "flights": processed_flights,
                "best_option": best_option,
                "route_info": f"{departure} → {arrival}",
                "departure_date": departure_date,
                "total_flights": len(processed_flights),
                "price_range": self._get_price_range(processed_flights),
                "booking_advice": [
                    "Book 2-3 weeks in advance for better prices",
                    "Compare baggage policies across airlines",
                    "Check cancellation and rescheduling terms",
                    "Consider travel insurance for flexibility"
                ],
                "next_steps": [
                    "Select preferred flight based on timing and price",
                    "Review airline's baggage allowance",
                    "Check seat availability and selection options",
                    "Verify booking terms and conditions",
                    "Proceed to booking"
                ]
            }
            
        except Exception as e:
            logger.error(f"Flight query processing error: {e}")
            return {
                "summary": f"I encountered an issue while searching for flights. Please try again with specific departure and arrival cities.",
                "error": str(e),
                "flights": []
            }
    
    def _extract_airport_from_query(self, query: str, position_type: str) -> Optional[str]:
        """Extract airport codes or cities from query"""
        query_lower = query.lower()
        
        # Airport code mappings
        airport_mappings = {
            'delhi': 'DEL', 'del': 'DEL', 'new delhi': 'DEL',
            'mumbai': 'BOM', 'bom': 'BOM', 'bombay': 'BOM',
            'bangalore': 'BLR', 'blr': 'BLR', 'bengaluru': 'BLR',
            'chennai': 'MAA', 'maa': 'MAA', 'madras': 'MAA',
            'hyderabad': 'HYD', 'hyd': 'HYD',
            'pune': 'PNQ', 'pnq': 'PNQ',
            'kolkata': 'CCU', 'ccu': 'CCU', 'calcutta': 'CCU',
            'goa': 'GOI', 'goi': 'GOI', 'panaji': 'GOI',
            'kochi': 'COK', 'cochin': 'COK', 'ernakulam': 'COK',
            'ahmedabad': 'AMD', 'amd': 'AMD',
            'jaipur': 'JAI', 'jai': 'JAI'
        }
        
        # Look for "from X to Y" pattern
        from_to_pattern = r'from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)'
        match = re.search(from_to_pattern, query_lower)
        
        if match:
            if position_type == 'departure':
                departure_city = match.group(1).strip()
                return airport_mappings.get(departure_city, departure_city.upper()[:3])
            elif position_type == 'arrival':
                arrival_city = match.group(2).strip()
                return airport_mappings.get(arrival_city, arrival_city.upper()[:3])
        
        # Fallback: look for any city mentioned
        for city, code in airport_mappings.items():
            if city in query_lower:
                return code
        
        return None
    
    def _get_route_name(self, departure: str, arrival: str) -> str:
        """Get readable route name"""
        city_names = {
            'DEL': 'Delhi', 'BOM': 'Mumbai', 'BLR': 'Bangalore',
            'MAA': 'Chennai', 'HYD': 'Hyderabad', 'PNQ': 'Pune',
            'CCU': 'Kolkata', 'GOI': 'Goa', 'COK': 'Kochi',
            'AMD': 'Ahmedabad', 'JAI': 'Jaipur'
        }
        
        dep_name = city_names.get(departure, departure)
        arr_name = city_names.get(arrival, arrival)
        
        return f"{dep_name} to {arr_name}"
    
    def _get_price_range(self, flights: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get price range information"""
        if not flights:
            return {"min": 0, "max": 0, "average": 0}
        
        prices = [f.get('price', 0) for f in flights if f.get('price', 0) > 0]
        
        if not prices:
            return {"min": 0, "max": 0, "average": 0}
        
        return {
            "min": min(prices),
            "max": max(prices),
            "average": sum(prices) / len(prices),
            "currency": "INR"
        }
    
    def _get_best_grocery_platform(self, cart: List[Dict[str, Any]]) -> str:
        """Determine the best grocery platform based on cart"""
        if not cart:
            return "Blinkit - Fast delivery"
        
        # Count items per platform
        platform_counts = {}
        platform_savings = {}
        
        for item in cart:
            platform = item.get('platform', 'Unknown')
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
            platform_savings[platform] = platform_savings.get(platform, 0) + item.get('savings', 0)
        
        if not platform_counts:
            return "Blinkit - Fast delivery"
        
        # Find platform with most items
        best_platform = max(platform_counts, key=platform_counts.get)
        
        # Add reasoning
        if len(platform_counts) == 1:
            return f"{best_platform} - All items available"
        else:
            return f"{best_platform} - Most items ({platform_counts[best_platform]}) with good savings"

# Create simplified agents
product_agent = SimpleAgent(
    name="product_agent",
    description="Specialized agent for handling product search and purchase queries from e-commerce platforms",
    instruction="Find and analyze products with price comparisons and credit card optimization",
    tools=["scrape_products", "analyze_prices", "recommend_cards"]
)

grocery_agent = SimpleAgent(
    name="grocery_agent", 
    description="Specialized agent for handling grocery and daily essentials search queries",
    instruction="Find grocery products with unit price comparisons and cart optimization",
    tools=["scrape_groceries", "analyze_groceries", "recommend_cards"]
)

flight_agent = SimpleAgent(
    name="flight_agent",
    description="Specialized agent for handling flight search and booking queries", 
    instruction="Find flights with price and schedule comparisons",
    tools=["scrape_flights", "recommend_cards"]
)

# Agent Registry
DOMAIN_AGENTS = {
    'product': product_agent,
    'grocery': grocery_agent,
    'flight': flight_agent
}

def get_agent_by_domain(domain: str) -> SimpleAgent:
    """Get agent by domain name"""
    if domain not in DOMAIN_AGENTS:
        raise ValueError(f"Agent for domain '{domain}' not found. Available domains: {list(DOMAIN_AGENTS.keys())}")
    return DOMAIN_AGENTS[domain]

def list_available_agents() -> List[str]:
    """List all available domain agents"""
    return list(DOMAIN_AGENTS.keys())

# Agent capability descriptions for the orchestrator
AGENT_CAPABILITIES = {
    'product': {
        'description': 'Handles product search, price comparison, and purchase recommendations',
        'keywords': ['buy', 'purchase', 'product', 'price', 'compare', 'deal', 'offer', 'shopping', 'iphone', 'laptop', 'phone', 'smartphone', 'samsung'],
        'platforms': ['Amazon', 'Flipkart'],
        'features': ['Cross-platform price comparison', 'Credit card optimization', 'Deal analysis', 'Product recommendations']
    },
    'grocery': {
        'description': 'Handles grocery shopping, unit price comparisons, and cart optimization',
        'keywords': ['grocery', 'food', 'milk', 'bread', 'vegetables', 'fruits', 'daily', 'essentials', 'kitchen', 'cooking'],
        'platforms': ['Blinkit', 'Zepto'],
        'features': ['Unit price comparison', 'Shopping cart optimization', 'Quick delivery options', 'Best value recommendations']
    },
    'flight': {
        'description': 'Handles flight search, booking recommendations, and travel planning',
        'keywords': ['flight', 'travel', 'booking', 'airport', 'airline', 'trip', 'journey', 'fly', 'ticket'],
        'platforms': ['Google Flights', 'MakeMyTrip', 'Cleartrip'],
        'features': ['Multi-platform comparison', 'Price analysis', 'Route optimization', 'Booking guidance']
    }
}

async def route_query_to_agent(query: str, intent_analysis: Dict[str, Any]) -> str:
    """
    Route user query to the appropriate domain agent based on intent analysis
    
    Args:
        query: Original user query
        intent_analysis: Result from intent classification
    
    Returns:
        Domain name for routing ('product', 'grocery', 'flight')
    """
    try:
        # Get intent from analysis
        intent = intent_analysis.get('intent', 'general_question')
        confidence = intent_analysis.get('confidence', 0.0)
        
        # Direct mapping for clear intents
        intent_to_domain = {
            'product_search': 'product',
            'flight_search': 'flight', 
            'grocery_search': 'grocery'
        }
        
        if intent in intent_to_domain and confidence > 0.6:
            logger.info(f"Routing to {intent_to_domain[intent]} based on intent: {intent}")
            return intent_to_domain[intent]
        
        # Keyword-based fallback routing
        query_lower = query.lower()
        
        # Check for grocery keywords (highest priority for food items)
        grocery_keywords = AGENT_CAPABILITIES['grocery']['keywords']
        if any(keyword in query_lower for keyword in grocery_keywords):
            logger.info(f"Routing to grocery based on keywords")
            return 'grocery'
        
        # Check for flight keywords  
        flight_keywords = AGENT_CAPABILITIES['flight']['keywords']
        if any(keyword in query_lower for keyword in flight_keywords):
            logger.info(f"Routing to flight based on keywords")
            return 'flight'
        
        # Check for product keywords (default for shopping)
        product_keywords = AGENT_CAPABILITIES['product']['keywords']
        if any(keyword in query_lower for keyword in product_keywords):
            logger.info(f"Routing to product based on keywords")
            return 'product'
        
        # If no clear match, default to product agent
        logger.warning(f"Could not clearly route query '{query}', defaulting to product agent")
        return 'product'
        
    except Exception as e:
        logger.error(f"Error in query routing: {e}")
        return 'product'  # Safe fallback

def get_agent_capabilities() -> Dict[str, Any]:
    """Get capabilities of all agents for orchestrator decision making"""
    return AGENT_CAPABILITIES

# Testing function
async def test_agents():
    """Test all agents with sample queries"""
    test_queries = [
        ("I want to buy an iPhone 15", "product", "HDFC Bank Millennia"),
        ("I need milk and bread", "grocery", "SBI SimplySAVE"),
        ("Find flights from Delhi to Mumbai", "flight", "Amazon Pay ICICI")
    ]
    
    print("Testing all agents...")
    
    for query, expected_domain, card in test_queries:
        print(f"\n--- Testing: {query} ---")
        
        # Test routing
        from tools import classify_query_intent_tool
        intent_result = await classify_query_intent_tool(query)
        routed_domain = await route_query_to_agent(query, intent_result)
        
        print(f"Expected: {expected_domain}, Routed: {routed_domain}")
        
        # Test agent processing
        agent = get_agent_by_domain(routed_domain)
        result = await agent.process_query(query, card, intent_result.get('extracted_params', {}))
        
        print(f"Result summary: {result.get('summary', 'No summary')}")
        print(f"Items found: {len(result.get('products', result.get('flights', result.get('grocery_items', []))))}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_agents())