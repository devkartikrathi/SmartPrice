"""
SmartPrice Agents - AI-powered analysis agents for different domains
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from google import genai
import os
import json

logger = logging.getLogger(__name__)

# Credit card database - comprehensive data for LLM analysis
CREDIT_CARD_DATABASE = [
    {
        "Bank": "HDFC Bank",
        "Card Name": "Millennia",
        "Key Features/Benefits": "5% cashback on Amazon, Flipkart, Myntra, Zomato, Swiggy, BookMyShow & Cult.fit. 1% on all other spends.",
        "Joining Fee (INR/AED)": "1,000",
        "Annual Fee (INR/AED)": "1,000",
        "Welcome Offer": "1000 Cash Points",
        "Rewards Program": "1 Cash Point = ₹0.25 on redemption against statement balance.",
        "Lounge Access": "8 complimentary domestic lounge visits per year.",
        "Other Benefits": "1% fuel surcharge waiver."
    },
    {
        "Bank": "HDFC Bank",
        "Card Name": "Regalia Gold",
        "Key Features/Benefits": "5X Reward Points on Myntra, Nykaa, Marks & Spencer and Reliance Digital.",
        "Joining Fee (INR/AED)": "2,500",
        "Annual Fee (INR/AED)": "2,500",
        "Welcome Offer": "Complimentary MMT Black Elite and Club Vistara Silver Tier membership.",
        "Rewards Program": "4 Reward Points per ₹150 spent.",
        "Lounge Access": "12 complimentary domestic and 6 international lounge visits per year.",
        "Other Benefits": "2% foreign currency markup fee."
    },
    {
        "Bank": "HDFC Bank",
        "Card Name": "Diners Club Black",
        "Key Features/Benefits": "2X Reward Points on weekend dining.",
        "Joining Fee (INR/AED)": "10,000",
        "Annual Fee (INR/AED)": "10,000",
        "Welcome Offer": "Complimentary memberships from Forbes, Amazon Prime, Swiggy One, and MMT BLACK.",
        "Rewards Program": "5 Reward Points for every ₹150 spent.",
        "Lounge Access": "Unlimited domestic and international lounge access for primary and add-on members.",
        "Other Benefits": "6 complimentary golf games per quarter."
    },
    {
        "Bank": "SBI Card",
        "Card Name": "SimplyCLICK",
        "Key Features/Benefits": "10X Reward Points on online spends with exclusive partners - Amazon, BookMyShow, Cleartrip, Lenskart, Netmeds, Myntra, etc.",
        "Joining Fee (INR/AED)": "499",
        "Annual Fee (INR/AED)": "499",
        "Welcome Offer": "Amazon gift card worth ₹500 on joining.",
        "Rewards Program": "1 Reward Point per ₹100 on all other spends.",
        "Lounge Access": "-",
        "Other Benefits": "1% fuel surcharge waiver."
    },
    {
        "Bank": "SBI Card",
        "Card Name": "SimplySAVE",
        "Key Features/Benefits": "10 Reward Points per ₹100 spent on Dining, Movies, Departmental Stores, and Grocery.",
        "Joining Fee (INR/AED)": "499",
        "Annual Fee (INR/AED)": "499",
        "Welcome Offer": "2,000 bonus Reward Points on spending ₹2,000 in first 60 days.",
        "Rewards Program": "1 Reward Point per ₹100 on all other spends.",
        "Lounge Access": "-",
        "Other Benefits": "1% fuel surcharge waiver."
    },
    {
        "Bank": "ICICI Bank",
        "Card Name": "Amazon Pay ICICI Bank",
        "Key Features/Benefits": "5% cashback on Amazon for Prime members, 3% for non-Prime.",
        "Joining Fee (INR/AED)": "Nil",
        "Annual Fee (INR/AED)": "Nil",
        "Welcome Offer": "-",
        "Rewards Program": "2% cashback on partner merchants, 1% on all other spends.",
        "Lounge Access": "-",
        "Other Benefits": "-"
    },
    {
        "Bank": "Axis Bank",
        "Card Name": "ACE",
        "Key Features/Benefits": "5% cashback on bill payments and DTH recharges on Google Pay. 4% on Swiggy, Zomato & Ola. 2% on all other spends.",
        "Joining Fee (INR/AED)": "499",
        "Annual Fee (INR/AED)": "499",
        "Welcome Offer": "-",
        "Rewards Program": "-",
        "Lounge Access": "4 complimentary domestic lounge visits per year.",
        "Other Benefits": "1% fuel surcharge waiver."
    },
    {
        "Bank": "Axis Bank",
        "Card Name": "Flipkart Axis Bank",
        "Key Features/Benefits": "5% cashback on Flipkart. 4% on partner merchants. 1.5% on all other spends.",
        "Joining Fee (INR/AED)": "500",
        "Annual Fee (INR/AED)": "500",
        "Welcome Offer": "Flipkart voucher worth ₹500.",
        "Rewards Program": "-",
        "Lounge Access": "4 complimentary domestic lounge visits per year.",
        "Other Benefits": "-"
    }
]

class BaseAgent(ABC):
    """Base class for all analysis agents"""
    
    def __init__(self, name: str, domain: str):
        self.name = name
        self.domain = domain
        self.available_tools = []
        self.credit_card_data = CREDIT_CARD_DATABASE
        
        # Initialize Gemini AI client
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            self.client = genai.Client(api_key=api_key)
            logger.info(f"{self.name} agent initialized with AI capabilities")
        except Exception as e:
            logger.error(f"Failed to initialize {self.name} agent: {e}")
            raise
    
    @abstractmethod
    async def process_query(self, query: str, credit_card: Optional[str] = None, extracted_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a query and return analysis results"""
        pass
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get agent capabilities and supported features"""
        return {
            "name": self.name,
            "domain": self.domain,
            "available_tools": self.available_tools,
            "credit_cards_supported": len(self.credit_card_data),
            "ai_powered": True
        }

class ProductAgent(BaseAgent):
    """Agent for product analysis and price comparison"""
    
    def __init__(self):
        super().__init__("Product Analysis Agent", "product")
        self.available_tools = ["scrape_products", "analyze_product_prices", "recommend_credit_cards"]
    
    async def process_query(self, query: str, credit_card: Optional[str] = None, extracted_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process product-related queries"""
        try:
            logger.info(f"Processing product query: {query}")
            
            # Simulate product data (in production, this would come from scraping service)
            product_data = self._get_sample_product_data(query)
            
            # Analyze with AI using credit card data
            analysis_result = await self._analyze_with_ai(query, product_data, credit_card)
            
            return {
                "summary": f"Found {len(analysis_result)} products for '{query}' with credit card optimization",
                "products": analysis_result,
                "best_deal": self._find_best_deal(analysis_result),
                "total_savings": sum(p.get('total_discount', 0) for p in analysis_result),
                "next_steps": [
                    "Compare prices across platforms",
                    "Check credit card benefits",
                    "Review delivery options"
                ],
                "domain": "product"
            }
            
        except Exception as e:
            logger.error(f"Error in product agent: {e}")
            return {
                "summary": f"Sorry, I encountered an error analyzing products for '{query}'",
                "error": str(e),
                "domain": "product"
            }
    
    def _get_sample_product_data(self, query: str) -> List[Dict[str, Any]]:
        """Get sample product data for analysis"""
        # This would be replaced with actual scraping in production
        return [
            {
                "title": f"Sample {query} - Premium Model",
                "price": 50000,
                "platform": "Amazon",
                "url": "https://amazon.in/sample",
                "rating": 4.5,
                "availability": "In Stock"
            },
            {
                "title": f"Sample {query} - Standard Model", 
                "price": 35000,
                "platform": "Flipkart",
                "url": "https://flipkart.com/sample",
                "rating": 4.2,
                "availability": "In Stock"
            }
        ]
    
    async def _analyze_with_ai(self, query: str, products: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Analyze products using AI and credit card data"""
        try:
            prompt = f"""
            You are an expert e-commerce pricing and credit card offer analyst. Analyze the following product data and return the most cost-effective purchasing options using the user's credit cards.

            QUERY: {query}
            USER CREDIT CARD: {credit_card or 'Not specified'}
            PRODUCTS: {json.dumps(products, indent=2)}
            CREDIT CARD DATABASE: {json.dumps(self.credit_card_data, indent=2)}

            Return a JSON array of analyzed products with:
            - product_title, platform, original_price, effective_price
            - credit_card_discount, total_discount, savings_percentage
            - recommended_card, card_benefit_description
            - confidence_score

            Focus on maximizing savings through credit card benefits.
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            
            result = json.loads(response.text)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._fallback_analysis(products, credit_card)
    
    def _fallback_analysis(self, products: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Fallback analysis when AI fails"""
        analyzed_products = []
        
        for product in products:
            # Simple benefit calculation
            original_price = product.get('price', 0)
            card_benefit = original_price * 0.02 if credit_card else 0  # 2% default
            effective_price = original_price - card_benefit
            
            analyzed_product = {
                "product_title": product.get('title', 'Unknown'),
                "platform": product.get('platform', 'Unknown'),
                "original_price": original_price,
                "effective_price": effective_price,
                "credit_card_discount": card_benefit,
                "total_discount": card_benefit,
                "savings_percentage": (card_benefit / original_price * 100) if original_price > 0 else 0,
                "recommended_card": credit_card or "No card specified",
                "card_benefit_description": f"Estimated {card_benefit:.2f} savings with credit card",
                "confidence_score": 0.7
            }
            analyzed_products.append(analyzed_product)
        
        return analyzed_products
    
    def _find_best_deal(self, products: List[Dict]) -> Optional[Dict[str, Any]]:
        """Find the best deal among analyzed products"""
        if not products:
            return None
        
        # Sort by effective price (lowest first)
        sorted_products = sorted(products, key=lambda x: x.get('effective_price', float('inf')))
        return sorted_products[0] if sorted_products else None

class GroceryAgent(BaseAgent):
    """Agent for grocery analysis and price comparison"""
    
    def __init__(self):
        super().__init__("Grocery Analysis Agent", "grocery")
        self.available_tools = ["scrape_groceries", "analyze_grocery_prices", "unit_price_calculation"]
    
    async def process_query(self, query: str, credit_card: Optional[str] = None, extracted_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process grocery-related queries"""
        try:
            logger.info(f"Processing grocery query: {query}")
            
            # Parse grocery items from query
            grocery_items = self._parse_grocery_query(query)
            
            # Get sample grocery data
            grocery_data = self._get_sample_grocery_data(grocery_items)
            
            # Analyze with AI
            analysis_result = await self._analyze_groceries_with_ai(query, grocery_data, credit_card)
            
            return {
                "summary": f"Found {len(analysis_result)} grocery items for '{query}' with unit pricing analysis",
                "grocery_items": analysis_result,
                "cart": self._create_optimized_cart(analysis_result),
                "total_savings": sum(item.get('total_discount', 0) for item in analysis_result),
                "next_steps": [
                    "Compare unit prices across platforms",
                    "Check for combo deals and bulk discounts",
                    "Review delivery time and minimum order requirements"
                ],
                "domain": "grocery"
            }
            
        except Exception as e:
            logger.error(f"Error in grocery agent: {e}")
            return {
                "summary": f"Sorry, I encountered an error analyzing groceries for '{query}'",
                "error": str(e),
                "domain": "grocery"
            }
    
    def _parse_grocery_query(self, query: str) -> List[str]:
        """Parse grocery query into individual items"""
        query_lower = query.lower()
        items = []
        
        # Simple keyword-based parsing
        if 'milk' in query_lower:
            items.append('milk')
        if 'bread' in query_lower:
            items.append('bread')
        if 'vegetables' in query_lower or 'vegetable' in query_lower:
            items.append('vegetables')
        if 'fruits' in query_lower or 'fruit' in query_lower:
            items.append('fruits')
        
        # If no specific items found, use the query as is
        if not items:
            items.append(query.strip())
        
        return items
    
    def _get_sample_grocery_data(self, items: List[str]) -> List[Dict[str, Any]]:
        """Get sample grocery data for analysis"""
        sample_data = []
        
        for item in items:
            if 'milk' in item.lower():
                sample_data.extend([
                    {
                        "title": "Amul Taaza Toned Milk 500ml",
                        "price": 29,
                        "platform": "Blinkit",
                        "weight": 0.5,
                        "unit": "l"
                    },
                    {
                        "title": "Amul Gold Full Cream Milk 1L",
                        "price": 69,
                        "platform": "Zepto",
                        "weight": 1.0,
                        "unit": "l"
                    }
                ])
            elif 'bread' in item.lower():
                sample_data.extend([
                    {
                        "title": "Harvest Gold White Bread 350g",
                        "price": 30,
                        "platform": "Blinkit",
                        "weight": 0.35,
                        "unit": "kg"
                    },
                    {
                        "title": "English Oven Wheat Bread 400g",
                        "price": 55,
                        "platform": "Zepto",
                        "weight": 0.4,
                        "unit": "kg"
                    }
                ])
            else:
                # Generic item
                sample_data.append({
                    "title": f"Sample {item}",
                    "price": 50,
                    "platform": "Blinkit",
                    "weight": 1.0,
                    "unit": "piece"
                })
        
        return sample_data
    
    async def _analyze_groceries_with_ai(self, query: str, products: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Analyze grocery products using AI"""
        try:
            prompt = f"""
            You are an expert grocery pricing analyst. Analyze the following grocery products and provide cost-effective recommendations with unit pricing.

            QUERY: {query}
            USER CREDIT CARD: {credit_card or 'Not specified'}
            PRODUCTS: {json.dumps(products, indent=2)}
            CREDIT CARD DATABASE: {json.dumps(self.credit_card_data, indent=2)}

            Return a JSON array with:
            - product_title, platform, original_price, effective_price
            - unit_price, unit_measure, quantity_available
            - credit_card_discount, total_discount, savings_percentage
            - recommended_card, card_benefit_description

            Calculate unit prices (per kg/liter/piece) and prioritize lower unit prices.
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            
            result = json.loads(response.text)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"AI grocery analysis failed: {e}")
            return self._fallback_grocery_analysis(products, credit_card)
    
    def _fallback_grocery_analysis(self, products: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Fallback grocery analysis"""
        analyzed_products = []
        
        for product in products:
            original_price = product.get('price', 0)
            weight = product.get('weight', 1.0)
            unit = product.get('unit', 'piece')
            
            # Calculate unit price
            unit_price = original_price / weight if weight > 0 else original_price
            
            # Simple credit card benefit
            card_benefit = original_price * 0.01 if credit_card else 0  # 1% default
            effective_price = original_price - card_benefit
            
            analyzed_product = {
                "product_title": product.get('title', 'Unknown'),
                "platform": product.get('platform', 'Unknown'),
                "original_price": original_price,
                "effective_price": effective_price,
                "unit_price": unit_price,
                "unit_measure": f"per_{unit}",
                "quantity_available": f"{weight} {unit}",
                "credit_card_discount": card_benefit,
                "total_discount": card_benefit,
                "savings_percentage": (card_benefit / original_price * 100) if original_price > 0 else 0,
                "recommended_card": credit_card or "No card specified",
                "card_benefit_description": f"Estimated {card_benefit:.2f} savings with credit card"
            }
            analyzed_products.append(analyzed_product)
        
        # Sort by unit price (lowest first)
        analyzed_products.sort(key=lambda x: x.get('unit_price', float('inf')))
        return analyzed_products
    
    def _create_optimized_cart(self, products: List[Dict]) -> List[Dict[str, Any]]:
        """Create optimized shopping cart"""
        cart = []
        
        for product in products[:5]:  # Top 5 products
            cart_item = {
                "product_name": product.get('product_title', 'Unknown'),
                "platform": product.get('platform', 'Unknown'),
                "quantity": 1,
                "unit_price": product.get('unit_price', 0),
                "total_price": product.get('effective_price', 0),
                "savings": product.get('total_discount', 0),
                "card_used": product.get('recommended_card', 'No card')
            }
            cart.append(cart_item)
        
        return cart

class FlightAgent(BaseAgent):
    """Agent for flight analysis and booking recommendations"""
    
    def __init__(self):
        super().__init__("Flight Analysis Agent", "flight")
        self.available_tools = ["scrape_flights", "analyze_flight_prices", "travel_recommendations"]
    
    async def process_query(self, query: str, credit_card: Optional[str] = None, extracted_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process flight-related queries"""
        try:
            logger.info(f"Processing flight query: {query}")
            
            # Extract flight parameters
            flight_params = self._extract_flight_params(query, extracted_params)
            
            # Get sample flight data
            flight_data = self._get_sample_flight_data(flight_params)
            
            # Analyze with AI
            analysis_result = await self._analyze_flights_with_ai(query, flight_data, credit_card)
            
            return {
                "summary": f"Found {len(analysis_result)} flights from {flight_params.get('from', 'Unknown')} to {flight_params.get('to', 'Unknown')}",
                "flights": analysis_result,
                "best_option": self._find_best_flight(analysis_result),
                "total_options": len(analysis_result),
                "next_steps": [
                    "Compare prices across airlines",
                    "Check baggage and meal options",
                    "Review cancellation policies"
                ],
                "domain": "flight"
            }
            
        except Exception as e:
            logger.error(f"Error in flight agent: {e}")
            return {
                "summary": f"Sorry, I encountered an error analyzing flights for '{query}'",
                "error": str(e),
                "domain": "flight"
            }
    
    def _extract_flight_params(self, query: str, extracted_params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract flight parameters from query or provided params"""
        if extracted_params:
            return extracted_params
        
        # Simple extraction from query
        query_lower = query.lower()
        params = {}
        
        # Extract from/to cities
        if 'from' in query_lower and 'to' in query_lower:
            parts = query_lower.split('from')
            if len(parts) > 1:
                to_part = parts[1].split('to')
                if len(to_part) > 1:
                    params['from'] = to_part[0].strip()
                    params['to'] = to_part[1].strip()
        
        # Default values
        params.setdefault('from', 'Delhi')
        params.setdefault('to', 'Mumbai')
        params.setdefault('date', '2025-01-15')
        params.setdefault('passengers', 1)
        
        return params
    
    def _get_sample_flight_data(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get sample flight data for analysis"""
        return [
            {
                "airline": "Air India",
                "flight_number": "AI101",
                "departure": "06:00",
                "arrival": "08:30",
                "duration": "2h 30m",
                "stops": "Direct",
                "price": 8000,
                "platform": "Google Flights"
            },
            {
                "airline": "IndiGo",
                "flight_number": "6E123",
                "departure": "09:15",
                "arrival": "11:45",
                "duration": "2h 30m",
                "stops": "Direct",
                "price": 6500,
                "platform": "MakeMyTrip"
            },
            {
                "airline": "Vistara",
                "flight_number": "UK789",
                "departure": "14:30",
                "arrival": "17:00",
                "duration": "2h 30m",
                "stops": "Direct",
                "price": 9500,
                "platform": "Cleartrip"
            }
        ]
    
    async def _analyze_flights_with_ai(self, query: str, flights: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Analyze flights using AI"""
        try:
            prompt = f"""
            You are an expert flight booking analyst. Analyze the following flight options and provide recommendations considering price, timing, and credit card benefits.

            QUERY: {query}
            USER CREDIT CARD: {credit_card or 'Not specified'}
            FLIGHTS: {json.dumps(flights, indent=2)}
            CREDIT CARD DATABASE: {json.dumps(self.credit_card_data, indent=2)}

            Return a JSON array with:
            - airline, flight_number, departure, arrival, duration, stops
            - original_price, effective_price, credit_card_discount
            - recommended_card, card_benefit_description
            - confidence_score

            Consider flight timing, duration, and credit card benefits for travel.
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )
            
            result = json.loads(response.text)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"AI flight analysis failed: {e}")
            return self._fallback_flight_analysis(flights, credit_card)
    
    def _fallback_flight_analysis(self, flights: List[Dict], credit_card: Optional[str]) -> List[Dict[str, Any]]:
        """Fallback flight analysis"""
        analyzed_flights = []
        
        for flight in flights:
            original_price = flight.get('price', 0)
            
            # Simple credit card benefit for travel
            card_benefit = original_price * 0.01 if credit_card else 0  # 1% default
            effective_price = original_price - card_benefit
            
            analyzed_flight = {
                "airline": flight.get('airline', 'Unknown'),
                "flight_number": flight.get('flight_number', 'Unknown'),
                "departure": flight.get('departure', 'Unknown'),
                "arrival": flight.get('arrival', 'Unknown'),
                "duration": flight.get('duration', 'Unknown'),
                "stops": flight.get('stops', 'Unknown'),
                "original_price": original_price,
                "effective_price": effective_price,
                "credit_card_discount": card_benefit,
                "recommended_card": credit_card or "No card specified",
                "card_benefit_description": f"Estimated {card_benefit:.2f} savings with credit card",
                "confidence_score": 0.7
            }
            analyzed_flights.append(analyzed_flight)
        
        # Sort by effective price (lowest first)
        analyzed_flights.sort(key=lambda x: x.get('effective_price', float('inf')))
        return analyzed_flights
    
    def _find_best_flight(self, flights: List[Dict]) -> Optional[Dict[str, Any]]:
        """Find the best flight option"""
        if not flights:
            return None
        
        # Sort by effective price (lowest first)
        sorted_flights = sorted(flights, key=lambda x: x.get('effective_price', float('inf')))
        return sorted_flights[0] if sorted_flights else None

# Agent registry and management
DOMAIN_AGENTS = {
    "product": ProductAgent,
    "grocery": GroceryAgent,
    "flight": FlightAgent
}

def get_agent_by_domain(domain: str) -> BaseAgent:
    """Get agent instance by domain"""
    if domain not in DOMAIN_AGENTS:
        raise ValueError(f"Unknown domain: {domain}")
    
    agent_class = DOMAIN_AGENTS[domain]
    return agent_class()

def list_available_agents() -> List[str]:
    """List all available agent domains"""
    return list(DOMAIN_AGENTS.keys())

def get_agent_capabilities() -> Dict[str, Any]:
    """Get capabilities of all agents"""
    capabilities = {}
    
    for domain, agent_class in DOMAIN_AGENTS.items():
        try:
            agent = agent_class()
            capabilities[domain] = agent.get_capabilities()
        except Exception as e:
            logger.error(f"Failed to get capabilities for {domain} agent: {e}")
            capabilities[domain] = {"error": str(e)}
    
    return capabilities

async def route_query_to_agent(query: str, intent_result: Dict[str, Any]) -> str:
    """Route query to appropriate agent based on intent"""
    intent = intent_result.get('intent', 'general')
    
    # Simple routing logic
    if any(word in query.lower() for word in ['buy', 'purchase', 'product', 'phone', 'laptop', 'electronics']):
        return "product"
    elif any(word in query.lower() for word in ['grocery', 'milk', 'bread', 'food', 'vegetables', 'fruits']):
        return "grocery"
    elif any(word in query.lower() for word in ['flight', 'fly', 'travel', 'airport', 'booking']):
        return "flight"
    else:
        # Default to product analysis
        return "product"