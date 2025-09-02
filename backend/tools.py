"""
SmartPrice Tools - Utility functions and analysis tools
"""

import logging
import re
from typing import Dict, Any, List, Optional
from google import genai
import os
import json

logger = logging.getLogger(__name__)

# Available tools registry
AVAILABLE_TOOLS = {
    "classify_query_intent": "Classify user query intent for routing",
    "scrape_products": "Scrape product information from e-commerce platforms",
    "scrape_flights": "Scrape flight information from booking platforms", 
    "scrape_groceries": "Scrape grocery products from quick commerce platforms",
    "analyze_product_prices": "Analyze product prices and calculate credit card benefits",
    "analyze_grocery_prices": "Analyze grocery prices with unit pricing optimization",
    "recommend_credit_cards": "Recommend optimal credit card usage for purchases"
}

class IntentClassifier:
    """Classify user queries into specific intents for routing"""
    
    def __init__(self):
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            self.client = genai.Client(api_key=api_key)
            logger.info("Intent classifier initialized with AI capabilities")
        except Exception as e:
            logger.error(f"Failed to initialize intent classifier: {e}")
            raise
    
    async def classify_intent(self, query: str) -> Dict[str, Any]:
        """Classify the intent of a user query"""
        try:
            prompt = f"""
            You are an expert intent classifier for an e-commerce and travel assistant. Classify the following user query into one of these categories:

            CATEGORIES:
            1. product_search - User wants to buy or compare products (electronics, clothing, etc.)
            2. grocery_search - User wants to buy groceries or food items
            3. flight_search - User wants to book or search for flights
            4. general_question - General questions about the service or other topics

            QUERY: "{query}"

            Return a JSON object with:
            - intent: The classified category
            - confidence: Confidence score (0.0 to 1.0)
            - extracted_params: Any relevant parameters extracted from the query
            - missing_params: List of missing parameters that would help provide better results
            - clarifying_questions: List of questions to ask the user for missing information

            Focus on the primary intent of the user's request.
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
            
            # Validate and sanitize result
            if not isinstance(result, dict):
                result = {}
            
            # Ensure required fields exist
            result.setdefault('intent', 'general_question')
            result.setdefault('confidence', 0.5)
            result.setdefault('extracted_params', {})
            result.setdefault('missing_params', [])
            result.setdefault('clarifying_questions', [])
            
            # Validate confidence score
            confidence = result.get('confidence', 0.5)
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                result['confidence'] = 0.5
            
            logger.info(f"Intent classified: {result['intent']} (confidence: {result['confidence']})")
            return result
            
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            return self._fallback_intent_classification(query)
    
    def _fallback_intent_classification(self, query: str) -> Dict[str, Any]:
        """Fallback intent classification using keyword matching"""
        query_lower = query.lower()
        
        # Product-related keywords
        product_keywords = ['buy', 'purchase', 'compare', 'price', 'phone', 'laptop', 'electronics', 'clothing', 'shoes']
        if any(keyword in query_lower for keyword in product_keywords):
            return {
                'intent': 'product_search',
                'confidence': 0.8,
                'extracted_params': {},
                'missing_params': ['specific product', 'budget range'],
                'clarifying_questions': ['What specific product are you looking for?', 'What is your budget range?']
            }
        
        # Grocery-related keywords
        grocery_keywords = ['grocery', 'milk', 'bread', 'food', 'vegetables', 'fruits', 'dairy', 'snacks']
        if any(keyword in query_lower for keyword in grocery_keywords):
            return {
                'intent': 'grocery_search',
                'confidence': 0.8,
                'extracted_params': {},
                'missing_params': ['delivery location', 'specific items'],
                'clarifying_questions': ['What is your delivery pincode?', 'Which specific grocery items do you need?']
            }
        
        # Flight-related keywords
        flight_keywords = ['flight', 'fly', 'travel', 'airport', 'booking', 'ticket', 'airline']
        if any(keyword in query_lower for keyword in flight_keywords):
            return {
                'intent': 'flight_search',
                'confidence': 0.8,
                'extracted_params': {},
                'missing_params': ['departure city', 'arrival city', 'travel date'],
                'clarifying_questions': ['From which city do you want to depart?', 'To which city do you want to travel?', 'When do you want to travel?']
            }
        
        # Default to general question
        return {
            'intent': 'general_question',
            'confidence': 0.6,
            'extracted_params': {},
            'missing_params': [],
            'clarifying_questions': ['How can I help you today?']
        }

class DataParser:
    """Utility functions for parsing and cleaning data"""
    
    @staticmethod
    def extract_price_from_text(text: str) -> float:
        """Extract price from text using regex patterns"""
        if not text:
            return 0.0
        
        # Replace Unicode rupee symbol
        text = text.replace('\u20b9', '₹')
        
        # Price patterns
        price_patterns = [
            r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)',
            r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)',
            r'INR\s*(\d+(?:,\d+)*(?:\.\d+)?)',
            r'(\d+(?:,\d+)*(?:\.\d+)?)\s*₹'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    # Remove commas and convert to float
                    price_str = matches[0].replace(',', '')
                    return float(price_str)
                except ValueError:
                    continue
        
        return 0.0
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s₹.,\-()]', '', text)
        
        return text
    
    @staticmethod
    def extract_weight_quantity(text: str) -> Dict[str, Any]:
        """Extract weight/quantity information from product title"""
        if not text:
            return {"quantity": 1.0, "unit": "pieces", "raw_text": "1 piece"}
        
        text_lower = text.lower()
        
        # Handle combo packs (e.g., "350g x 2", "700g x 4")
        combo_patterns = [
            (r'(\d+(?:\.\d+)?)\s*(g|gram|gm)\s*x\s*(\d+)', 'g'),
            (r'(\d+(?:\.\d+)?)\s*(ml|milliliter|millilitre)\s*x\s*(\d+)', 'ml'),
            (r'(\d+(?:\.\d+)?)\s*(l|liter|litre)\s*x\s*(\d+)', 'l'),
            (r'(\d+(?:\.\d+)?)\s*(kg|kilogram)\s*x\s*(\d+)', 'kg')
        ]
        
        for pattern, unit_type in combo_patterns:
            match = re.search(pattern, text_lower)
            if match:
                single_weight = float(match.group(1))
                multiplier = int(match.group(3))
                total_weight = single_weight * multiplier
                
                # Normalize to base units
                if unit_type == 'ml':
                    total_weight = total_weight / 1000
                    unit = 'l'
                elif unit_type == 'g':
                    total_weight = total_weight / 1000
                    unit = 'kg'
                else:
                    unit = unit_type
                
                return {
                    "quantity": total_weight,
                    "unit": unit,
                    "raw_text": match.group(0)
                }
        
        # Handle regular weight patterns
        patterns = [
            (r'(\d+(?:\.\d+)?)\s*(ml|milliliter|millilitre)', 'ml'),
            (r'(\d+(?:\.\d+)?)\s*(l|liter|litre)', 'l'),
            (r'(\d+(?:\.\d+)?)\s*(g|gram|gm)', 'g'),
            (r'(\d+(?:\.\d+)?)\s*(kg|kilogram)', 'kg'),
            (r'(\d+)\s*(piece|pieces|pc|pcs)', 'pieces'),
            (r'(\d+)\s*(pack|packet|pkt)', 'packets')
        ]
        
        for pattern, unit_type in patterns:
            match = re.search(pattern, text_lower)
            if match:
                quantity = float(match.group(1))
                
                # Normalize to base units
                if unit_type == 'ml':
                    quantity = quantity / 1000
                    unit = 'l'
                elif unit_type == 'g':
                    quantity = quantity / 1000
                    unit = 'kg'
                else:
                    unit = unit_type
                
                return {
                    "quantity": quantity,
                    "unit": unit,
                    "raw_text": match.group(0)
                }
        
        return {"quantity": 1.0, "unit": "pieces", "raw_text": "1 piece"}

class ResponseValidator:
    """Validate and sanitize API responses"""
    
    @staticmethod
    def validate_product_response(products: List[Dict[str, Any]]) -> bool:
        """Validate product response structure"""
        if not isinstance(products, list):
            return False
        
        required_fields = ['product_title', 'platform', 'original_price', 'effective_price']
        
        for product in products:
            if not isinstance(product, dict):
                return False
            
            for field in required_fields:
                if field not in product:
                    return False
        
        return True
    
    @staticmethod
    def sanitize_response(data: Any) -> Any:
        """Sanitize response data to ensure it's JSON serializable"""
        if isinstance(data, dict):
            return {key: ResponseValidator.sanitize_response(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [ResponseValidator.sanitize_response(item) for item in data]
        elif isinstance(data, (str, int, float, bool, type(None))):
            return data
        else:
            return str(data)

# Convenience functions for easy access
async def classify_query_intent_tool(query: str) -> Dict[str, Any]:
    """Classify query intent using AI"""
    classifier = IntentClassifier()
    return await classifier.classify_intent(query)

def extract_price_from_text_tool(text: str) -> float:
    """Extract price from text"""
    return DataParser.extract_price_from_text(text)

def clean_text_tool(text: str) -> str:
    """Clean and normalize text"""
    return DataParser.clean_text(text)

def extract_weight_quantity_tool(text: str) -> Dict[str, Any]:
    """Extract weight/quantity from text"""
    return DataParser.extract_weight_quantity(text)

def validate_response_tool(data: Any) -> bool:
    """Validate response structure"""
    if isinstance(data, list):
        return ResponseValidator.validate_product_response(data)
    return True

def sanitize_response_tool(data: Any) -> Any:
    """Sanitize response data"""
    return ResponseValidator.sanitize_response(data)

# Mock scraping functions (to be replaced with actual implementations)
async def scrape_products_tool(query: str, max_products: int = 5) -> Dict[str, Any]:
    """Mock product scraping - replace with actual implementation"""
    logger.info(f"Mock scraping products for: {query}")
    return {
        "query": query,
        "products": [],
        "platforms_scraped": ["amazon", "flipkart"],
        "note": "Mock data - replace with actual scraping implementation"
    }

async def scrape_flights_tool(departure: str, arrival: str, date: str) -> Dict[str, Any]:
    """Mock flight scraping - replace with actual implementation"""
    logger.info(f"Mock scraping flights from {departure} to {arrival} on {date}")
    return {
        "departure": departure,
        "arrival": arrival,
        "date": date,
        "flights": [],
        "platforms_scraped": ["google_flights", "makemytrip"],
        "note": "Mock data - replace with actual scraping implementation"
    }

async def scrape_groceries_tool(query: str, pincode: str) -> Dict[str, Any]:
    """Mock grocery scraping - replace with actual implementation"""
    logger.info(f"Mock scraping groceries for: {query} in pincode: {pincode}")
    return {
        "query": query,
        "pincode": pincode,
        "products": [],
        "platforms_scraped": ["blinkit", "zepto"],
        "note": "Mock data - replace with actual scraping implementation"
    }

async def analyze_product_prices_tool(products: List[Dict], credit_cards: List[str]) -> List[Dict[str, Any]]:
    """Mock product price analysis - replace with actual implementation"""
    logger.info(f"Mock analyzing {len(products)} products with {len(credit_cards)} credit cards")
    return []

async def analyze_grocery_prices_tool(products: List[Dict], credit_cards: List[str]) -> List[Dict[str, Any]]:
    """Mock grocery price analysis - replace with actual implementation"""
    logger.info(f"Mock analyzing {len(products)} grocery items with {len(credit_cards)} credit cards")
    return []

async def recommend_credit_cards_tool(purchase_amount: float, category: str) -> List[Dict[str, Any]]:
    """Mock credit card recommendations - replace with actual implementation"""
    logger.info(f"Mock recommending credit cards for ₹{purchase_amount} purchase in {category} category")
    return []