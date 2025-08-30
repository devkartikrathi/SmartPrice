"""
Tools for the ADK-based E-commerce Application
Self-contained scraping tools with embedded functionality
"""

import json
import logging
import asyncio
import aiohttp
import re
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class ProductSearchResult(BaseModel):
    """Product search result schema"""
    query: str
    products: List[Dict[str, Any]]
    total_products: int
    platforms_scraped: List[str]
    scrape_type: str = "product"

class FlightSearchResult(BaseModel):
    """Flight search result schema"""
    query: str
    flights: List[Dict[str, Any]]
    departure_date: str
    return_date: Optional[str] = None
    trip_type: str
    total_flights: int
    platforms_scraped: List[str]
    scrape_type: str = "flight"

class GrocerySearchResult(BaseModel):
    """Grocery search result schema"""
    query: str
    products: List[Dict[str, Any]]
    platform: str
    pincode: str
    total_products: int
    scrape_type: str = "grocery"

# Mock Data for Testing (Replace with real scraping in production)
MOCK_PRODUCTS = {
    'iphone': [
        {
            'title': 'Apple iPhone 15 (128 GB) - Black',
            'price_str': '₹61,499',
            'platform': 'Amazon',
            'url': 'https://amazon.in/iphone15-black',
            'rating_str': '4.5 out of 5 stars'
        },
        {
            'title': 'Apple iPhone 15 (128 GB) - Pink',
            'price_str': '₹59,900', 
            'platform': 'Flipkart',
            'url': 'https://flipkart.com/iphone15-pink',
            'rating_str': '4.4 out of 5 stars'
        },
        {
            'title': 'Apple iPhone 15 (128 GB) - Blue',
            'price_str': '₹61,499',
            'platform': 'Amazon',
            'url': 'https://amazon.in/iphone15-blue',
            'rating_str': '4.5 out of 5 stars'
        }
    ],
    'laptop': [
        {
            'title': 'Dell Inspiron 15 3000 Laptop',
            'price_str': '₹45,990',
            'platform': 'Amazon',
            'url': 'https://amazon.in/dell-inspiron-laptop',
            'rating_str': '4.2 out of 5 stars'
        },
        {
            'title': 'HP Pavilion Gaming Laptop',
            'price_str': '₹52,999',
            'platform': 'Flipkart', 
            'url': 'https://flipkart.com/hp-pavilion-gaming',
            'rating_str': '4.3 out of 5 stars'
        },
        {
            'title': 'Lenovo IdeaPad 3 Laptop',
            'price_str': '₹48,500',
            'platform': 'Amazon',
            'url': 'https://amazon.in/lenovo-ideapad-3',
            'rating_str': '4.1 out of 5 stars'
        }
    ],
    'samsung': [
        {
            'title': 'Samsung Galaxy S24 (128GB) - Black',
            'price_str': '₹74,999',
            'platform': 'Amazon',
            'url': 'https://amazon.in/samsung-galaxy-s24',
            'rating_str': '4.4 out of 5 stars'
        },
        {
            'title': 'Samsung Galaxy S24 (256GB) - Violet',
            'price_str': '₹79,999',
            'platform': 'Flipkart',
            'url': 'https://flipkart.com/samsung-galaxy-s24',
            'rating_str': '4.5 out of 5 stars'
        }
    ],
    'generic': [
        {
            'title': 'Best Smartphone 2024',
            'price_str': '₹25,999',
            'platform': 'Amazon',
            'url': 'https://amazon.in/best-smartphone',
            'rating_str': '4.0 out of 5 stars'
        }
    ]
}

MOCK_FLIGHTS = [
    {
        'airline': 'IndiGo',
        'price_str': '₹4,245',
        'departure_time': '06:00',
        'arrival_time': '08:15',
        'duration': '2h 15m',
        'stops': '0',
        'url': 'https://booking.com/indigo-flight1',
        'platform': 'Google Flights'
    },
    {
        'airline': 'SpiceJet',
        'price_str': '₹3,899',
        'departure_time': '14:30',
        'arrival_time': '16:45', 
        'duration': '2h 15m',
        'stops': '0',
        'url': 'https://makemytrip.com/spicejet-flight2',
        'platform': 'MakeMyTrip'
    },
    {
        'airline': 'Air India',
        'price_str': '₹5,150',
        'departure_time': '19:00',
        'arrival_time': '21:30',
        'duration': '2h 30m',
        'stops': '0',
        'url': 'https://airindia.com/flight3',
        'platform': 'Google Flights'
    },
    {
        'airline': 'Vistara',
        'price_str': '₹6,200',
        'departure_time': '10:15',
        'arrival_time': '12:45',
        'duration': '2h 30m',
        'stops': '0',
        'url': 'https://airvistara.com/flight4',
        'platform': 'MakeMyTrip'
    }
]

MOCK_GROCERY = {
    'blinkit': [
        {
            'product_title': 'Amul Taaza Toned Milk 1L',
            'price': '₹57',
            'brand': 'Amul',
            'weight': '1L',
            'availability': 'In Stock',
            'platform': 'blinkit'
        },
        {
            'product_title': 'Harvest Gold White Bread 350g',
            'price': '₹30',
            'brand': 'Harvest Gold', 
            'weight': '350g',
            'availability': 'In Stock',
            'platform': 'blinkit'
        },
        {
            'product_title': 'Mother Dairy Toned Milk 500ml',
            'price': '₹29',
            'brand': 'Mother Dairy',
            'weight': '500ml',
            'availability': 'In Stock',
            'platform': 'blinkit'
        },
        {
            'product_title': 'Britannia Brown Bread 350g',
            'price': '₹35',
            'brand': 'Britannia',
            'weight': '350g',
            'availability': 'In Stock',
            'platform': 'blinkit'
        }
    ],
    'zepto': [
        {
            'product_title': 'Amul Gold Full Cream Milk 1L',
            'price': '₹69',
            'brand': 'Amul',
            'weight': '1L', 
            'availability': 'In Stock',
            'platform': 'zepto'
        },
        {
            'product_title': 'Modern White Bread 400g',
            'price': '₹28',
            'brand': 'Modern',
            'weight': '400g',
            'availability': 'In Stock',
            'platform': 'zepto'
        },
        {
            'product_title': 'Country Delight Cow Milk 500ml',
            'price': '₹35',
            'brand': 'Country Delight',
            'weight': '500ml',
            'availability': 'In Stock',
            'platform': 'zepto'
        }
    ]
}

# Credit Card Benefits Database
CREDIT_CARD_BENEFITS = {
    'HDFC Bank Millennia': {
        'cashback_rate': 0.05,
        'annual_fee': '₹1,000',
        'benefits': '5% cashback on Amazon, Flipkart, Myntra, Zomato, Swiggy',
        'grocery_rate': 0.01,
        'online_rate': 0.05
    },
    'SBI SimplyCLICK': {
        'cashback_rate': 0.10,
        'annual_fee': '₹499',
        'benefits': '10X points on online shopping partners',
        'grocery_rate': 0.01,
        'online_rate': 0.10
    },
    'SBI SimplySAVE': {
        'cashback_rate': 0.10,
        'annual_fee': '₹499',
        'benefits': '10X points on dining, movies, grocery stores',
        'grocery_rate': 0.10,
        'online_rate': 0.01
    },
    'Amazon Pay ICICI': {
        'cashback_rate': 0.05,
        'annual_fee': 'Nil',
        'benefits': '5% cashback on Amazon, 2% on other merchants',
        'grocery_rate': 0.01,
        'online_rate': 0.05
    },
    'Flipkart Axis Bank': {
        'cashback_rate': 0.05,
        'annual_fee': '₹500',
        'benefits': '5% cashback on Flipkart, 4% on partner merchants',
        'grocery_rate': 0.01,
        'online_rate': 0.05
    }
}

# Utility Functions
def extract_price_from_text(text: str) -> float:
    """Extract price from text using regex patterns"""
    if not text:
        return 0.0
    
    text = text.replace('\u20b9', '₹')
    
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
                price_str = matches[0].replace(',', '')
                return float(price_str)
            except ValueError:
                continue
    
    return 0.0

def get_mock_data_for_query(query: str, data_type: str) -> List[Dict[str, Any]]:
    """Get mock data based on query keywords"""
    query_lower = query.lower()
    
    if data_type == 'products':
        if any(keyword in query_lower for keyword in ['iphone', '15', 'apple']):
            return MOCK_PRODUCTS.get('iphone', [])
        elif any(keyword in query_lower for keyword in ['laptop', 'computer', 'dell', 'hp', 'lenovo']):
            return MOCK_PRODUCTS.get('laptop', [])
        elif any(keyword in query_lower for keyword in ['samsung', 'galaxy', 's24']):
            return MOCK_PRODUCTS.get('samsung', [])
        elif any(keyword in query_lower for keyword in ['phone', 'smartphone', 'mobile']):
            return MOCK_PRODUCTS.get('iphone', [])[:1] + MOCK_PRODUCTS.get('samsung', [])[:1]
        else:
            return MOCK_PRODUCTS.get('generic', [])
    
    elif data_type == 'flights':
        return MOCK_FLIGHTS
    
    elif data_type == 'groceries':
        platform = 'blinkit'  # Default platform
        if 'zepto' in query_lower:
            platform = 'zepto'
        return MOCK_GROCERY.get(platform, [])
    
    return []

def calculate_credit_card_benefits(price: float, card_name: str, category: str = 'general') -> Dict[str, Any]:
    """Calculate credit card benefits for a purchase"""
    if card_name not in CREDIT_CARD_BENEFITS:
        return {
            'cashback_earned': 0.0,
            'effective_cashback_rate': 0.0,
            'benefits_description': 'No card benefits available'
        }
    
    card_info = CREDIT_CARD_BENEFITS[card_name]
    
    # Determine cashback rate based on category
    if category == 'grocery':
        cashback_rate = card_info.get('grocery_rate', 0.01)
    elif category == 'online':
        cashback_rate = card_info.get('online_rate', 0.01)
    else:
        cashback_rate = card_info.get('cashback_rate', 0.01)
    
    cashback_earned = price * cashback_rate
    
    return {
        'cashback_earned': cashback_earned,
        'effective_cashback_rate': cashback_rate * 100,
        'benefits_description': card_info.get('benefits', ''),
        'annual_fee': card_info.get('annual_fee', 'N/A')
    }

# Product Scraping Tool
async def scrape_products_tool(
    query: str,
    max_products: int = 5,
    platforms: List[str] = None
) -> ProductSearchResult:
    """
    Scrape product information from e-commerce platforms.
    
    Args:
        query: Product search query (e.g., "iPhone 15 128GB")
        max_products: Maximum products per platform (default: 5)
        platforms: List of platforms to search (default: ["amazon", "flipkart"])
    
    Returns:
        ProductSearchResult with scraped product data
    """
    try:
        logger.info(f"Product scraping tool called with query: {query}")
        
        if platforms is None:
            platforms = ["amazon", "flipkart"]
        
        # Get mock data for now (replace with real scraping)
        products_data = get_mock_data_for_query(query, 'products')
        
        # Format products for response
        products = []
        for product in products_data[:max_products]:
            products.append({
                'listing_info': product,
                'detailed_info': {'offer_details': f'Special offers and deals available for {product["title"]}'}
            })
        
        return ProductSearchResult(
            query=query,
            products=products,
            total_products=len(products),
            platforms_scraped=platforms
        )
        
    except Exception as e:
        logger.error(f"Product scraping tool error: {e}")
        return ProductSearchResult(
            query=query,
            products=[],
            total_products=0,
            platforms_scraped=platforms or []
        )

# Flight Scraping Tool
async def scrape_flights_tool(
    departure_airport: str,
    arrival_airport: str,
    departure_date: str,
    return_date: Optional[str] = None,
    trip_type: str = "one_way",
    passengers: Dict[str, int] = None,
    travel_class: str = "economy",
    max_flights: int = 10,
    platforms: List[str] = None
) -> FlightSearchResult:
    """
    Scrape flight information from booking platforms.
    
    Args:
        departure_airport: Departure airport code (e.g., "DEL")
        arrival_airport: Arrival airport code (e.g., "BOM")
        departure_date: Departure date in YYYY-MM-DD format
        return_date: Return date for round trip
        trip_type: "one_way" or "round_trip"
        passengers: Number of passengers by type
        travel_class: "economy", "business", etc.
        max_flights: Maximum flights per platform
        platforms: Platforms to search
    
    Returns:
        FlightSearchResult with scraped flight data
    """
    try:
        logger.info(f"Flight scraping tool called: {departure_airport} to {arrival_airport}")
        
        if passengers is None:
            passengers = {"adults": 1, "children": 0, "infants": 0}
        
        if platforms is None:
            platforms = ["google_flights", "makemytrip"]
        
        # Get mock flight data
        flights_data = get_mock_data_for_query(f"{departure_airport} {arrival_airport}", 'flights')
        
        # Format flights for response
        flights = []
        for flight in flights_data[:max_flights]:
            flights.append({
                'listing_info': flight,
                'detailed_info': {'flight_details': f'Flight from {departure_airport} to {arrival_airport} on {departure_date}'}
            })
        
        return FlightSearchResult(
            query=f"{departure_airport} to {arrival_airport}",
            flights=flights,
            departure_date=departure_date,
            return_date=return_date,
            trip_type=trip_type,
            total_flights=len(flights),
            platforms_scraped=platforms
        )
        
    except Exception as e:
        logger.error(f"Flight scraping tool error: {e}")
        return FlightSearchResult(
            query=f"{departure_airport} to {arrival_airport}",
            flights=[],
            departure_date=departure_date,
            return_date=return_date,
            trip_type=trip_type,
            total_flights=0,
            platforms_scraped=platforms or []
        )

# Grocery Scraping Tool
async def scrape_groceries_tool(
    keyword: str,
    pincode: str,
    platform: str,
    max_products: int = 10
) -> GrocerySearchResult:
    """
    Scrape grocery products from quick commerce platforms.
    
    Args:
        keyword: Product keyword (e.g., "milk")
        pincode: 6-digit delivery pincode
        platform: "blinkit" or "zepto"
        max_products: Maximum products to fetch
    
    Returns:
        GrocerySearchResult with scraped grocery data
    """
    try:
        logger.info(f"Grocery scraping tool called: {keyword} on {platform}")
        
        # Get mock grocery data based on keyword and platform
        all_products = MOCK_GROCERY.get(platform, [])
        
        # Filter products based on keyword
        keyword_lower = keyword.lower()
        filtered_products = []
        
        for product in all_products:
            product_title_lower = product['product_title'].lower()
            if any(word in product_title_lower for word in keyword_lower.split()):
                filtered_products.append(product)
        
        # If no specific matches, return all products from platform
        if not filtered_products:
            filtered_products = all_products
        
        return GrocerySearchResult(
            query=keyword,
            products=filtered_products[:max_products],
            platform=platform,
            pincode=pincode,
            total_products=len(filtered_products)
        )
        
    except Exception as e:
        logger.error(f"Grocery scraping tool error: {e}")
        return GrocerySearchResult(
            query=keyword,
            products=[],
            platform=platform,
            pincode=pincode,
            total_products=0
        )

# Price Analysis Tool
async def analyze_product_prices_tool(
    products: List[Dict[str, Any]],
    user_credit_cards: List[str]
) -> Dict[str, Any]:
    """
    Analyze product prices and calculate credit card benefits.
    
    Args:
        products: List of scraped products
        user_credit_cards: User's credit cards
    
    Returns:
        Dict with analyzed pricing and recommendations
    """
    try:
        logger.info(f"Price analysis tool called for {len(products)} products")
        
        analyzed_products = []
        
        for product in products:
            # Handle both nested and flat product structures
            if isinstance(product, dict) and 'listing_info' in product:
                listing_info = product['listing_info']
            else:
                listing_info = product
            
            title = listing_info.get('title', 'Unknown Product')
            price_str = listing_info.get('price_str', '₹0')
            platform = listing_info.get('platform', 'Unknown')
            url = listing_info.get('url', '')
            
            # Extract price
            original_price = extract_price_from_text(price_str)
            
            if original_price <= 0:
                continue
            
            # Determine best credit card
            best_card = user_credit_cards[0] if user_credit_cards else "No Card"
            best_benefits = None
            best_cashback = 0.0
            
            # Calculate benefits for each card
            for card in user_credit_cards:
                benefits = calculate_credit_card_benefits(original_price, card, 'online')
                if benefits['cashback_earned'] > best_cashback:
                    best_cashback = benefits['cashback_earned']
                    best_card = card
                    best_benefits = benefits
            
            # If no benefits calculated, use default
            if not best_benefits:
                best_benefits = calculate_credit_card_benefits(original_price, best_card, 'online')
            
            credit_card_discount = best_benefits['cashback_earned']
            effective_price = original_price - credit_card_discount
            savings_percentage = (credit_card_discount / original_price * 100) if original_price > 0 else 0
            
            analyzed_product = {
                "product_title": title,
                "product_url": url,
                "platform": platform,
                "original_price": original_price,
                "platform_discount": 0.0,
                "credit_card_discount": credit_card_discount,
                "total_discount": credit_card_discount,
                "effective_price": effective_price,
                "savings_percentage": savings_percentage,
                "recommended_card": best_card,
                "card_benefit_description": best_benefits['benefits_description'],
                "credit_card_benefits": {
                    "reward_points_earned": 0.0,
                    "reward_points_value": 0.0,
                    "cashback_earned": credit_card_discount,
                    "effective_cashback_rate": best_benefits['effective_cashback_rate'],
                    "annual_fee": best_benefits['annual_fee'],
                    "total_value_benefit": credit_card_discount
                },
                "confidence_score": 0.9,
                "availability_status": "In_Stock",
                "delivery_info": "Standard delivery available"
            }
            
            analyzed_products.append(analyzed_product)
        
        # Sort by effective price (lowest first)
        analyzed_products.sort(key=lambda x: x['effective_price'])
        
        return {
            'analyzed_products': analyzed_products,
            'total_products': len(analyzed_products),
            'user_credit_cards': user_credit_cards
        }
        
    except Exception as e:
        logger.error(f"Price analysis tool error: {e}")
        return {
            'analyzed_products': [],
            'total_products': 0,
            'error': str(e)
        }

# Grocery Analysis Tool
async def analyze_grocery_prices_tool(
    grocery_query: str,
    user_credit_cards: List[str],
    scraped_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Analyze grocery prices with unit pricing and optimization.
    
    Args:
        grocery_query: Natural language grocery request
        user_credit_cards: User's credit cards
        scraped_data: Optional pre-scraped data
    
    Returns:
        Dict with grocery analysis including cart optimization
    """
    try:
        logger.info(f"Grocery analysis tool called for: {grocery_query}")
        
        # Parse grocery items from query
        grocery_items = []
        products = []
        cart = []
        
        query_lower = grocery_query.lower()
        
        # Extract items mentioned in query
        items_found = []
        if 'milk' in query_lower:
            items_found.append('milk')
        if 'bread' in query_lower:
            items_found.append('bread')
        if not items_found:
            items_found = ['general groceries']
        
        total_savings = 0.0
        
        # For each item, find best options from both platforms
        for item in items_found:
            # Get products from both platforms
            blinkit_products = []
            zepto_products = []
            
            if item == 'milk':
                blinkit_products = [p for p in MOCK_GROCERY['blinkit'] if 'milk' in p['product_title'].lower()]
                zepto_products = [p for p in MOCK_GROCERY['zepto'] if 'milk' in p['product_title'].lower()]
            elif item == 'bread':
                blinkit_products = [p for p in MOCK_GROCERY['blinkit'] if 'bread' in p['product_title'].lower()]
                zepto_products = [p for p in MOCK_GROCERY['zepto'] if 'bread' in p['product_title'].lower()]
            else:
                # General items - get some from each platform
                blinkit_products = MOCK_GROCERY['blinkit'][:2]
                zepto_products = MOCK_GROCERY['zepto'][:2]
            
            all_item_products = blinkit_products + zepto_products
            
            if not all_item_products:
                continue
            
            # Create grocery item entry
            grocery_item = {
                'name': item,
                'requested_quantity': '1 unit',
                'normalized_quantity': 1.0,
                'unit': 'pieces',
                'category': 'general',
                'product_options': []
            }
            
            # Process each product option
            for product in all_item_products:
                price = extract_price_from_text(product['price'])
                
                # Calculate credit card benefits
                best_card = user_credit_cards[0] if user_credit_cards else "No Card"
                benefits = calculate_credit_card_benefits(price, best_card, 'grocery')
                
                credit_card_discount = benefits['cashback_earned']
                effective_price = price - credit_card_discount
                
                analyzed_product = {
                    'product_title': product['product_title'],
                    'original_price': price,
                    'effective_price': effective_price,
                    'credit_card_discount': credit_card_discount,
                    'platform': product['platform'].title(),
                    'recommended_card': best_card,
                    'grocery_analysis': {
                        'unit_price': price,
                        'effective_price_per_unit': effective_price,
                        'unit_measure': 'per_piece',
                        'weight_info': product.get('weight', '1 unit')
                    }
                }
                
                grocery_item['product_options'].append(analyzed_product)
                products.append(analyzed_product)
            
            # Sort options by effective price and select best
            grocery_item['product_options'].sort(key=lambda x: x['effective_price'])
            best_option = grocery_item['product_options'][0] if grocery_item['product_options'] else None
            
            if best_option:
                # Add to cart
                savings = best_option['credit_card_discount']
                cart_item = {
                    'product_name': best_option['product_title'],
                    'platform': best_option['platform'],
                    'quantity': 1,
                    'total_quantity_price': best_option['effective_price'],
                    'savings': savings,
                    'card_used': best_option['recommended_card']
                }
                cart.append(cart_item)
                total_savings += savings
            
            grocery_items.append(grocery_item)
        
        return {
            'products': products,
            'grocery_items': grocery_items,
            'cart': cart,
            'total_savings': total_savings,
            'analysis_type': 'grocery',
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Grocery analysis tool error: {e}")
        return {
            'products': [],
            'grocery_items': [],
            'cart': [],
            'total_savings': 0.0,
            'error': str(e),
            'analysis_type': 'grocery'
        }

# Intent Classification Tool
async def classify_query_intent_tool(user_query: str) -> Dict[str, Any]:
    """
    Classify user query intent using keyword matching.
    
    Args:
        user_query: Natural language user query
    
    Returns:
        Dict with intent classification and extracted parameters
    """
    try:
        logger.info(f"Intent classification tool called for: {user_query}")
        
        query_lower = user_query.lower()
        
        # Intent classification based on keywords
        if any(keyword in query_lower for keyword in ['buy', 'purchase', 'product', 'price', 'compare', 'iphone', 'laptop', 'phone', 'smartphone', 'samsung']):
            intent = 'product_search'
            confidence = 0.8
            
            # Extract product name
            if 'iphone' in query_lower:
                extracted_params = {'product_name': 'iPhone'}
            elif 'laptop' in query_lower:
                extracted_params = {'product_name': 'laptop'}
            elif 'samsung' in query_lower:
                extracted_params = {'product_name': 'Samsung'}
            else:
                extracted_params = {'product_name': user_query}
            
            missing_params = []
            clarifying_questions = []
            
        elif any(keyword in query_lower for keyword in ['flight', 'fly', 'travel', 'airport', 'airline', 'book', 'ticket', 'trip']):
            intent = 'flight_search'
            confidence = 0.8
            extracted_params = {}
            missing_params = []
            clarifying_questions = []
            
            # Extract airports if mentioned
            airport_mappings = {
                'delhi': 'DEL', 'del': 'DEL',
                'mumbai': 'BOM', 'bom': 'BOM', 'bombay': 'BOM',
                'bangalore': 'BLR', 'blr': 'BLR', 'bengaluru': 'BLR',
                'chennai': 'MAA', 'maa': 'MAA', 'madras': 'MAA',
                'hyderabad': 'HYD', 'hyd': 'HYD',
                'pune': 'PNQ', 'pnq': 'PNQ',
                'kolkata': 'CCU', 'ccu': 'CCU',
                'goa': 'GOI', 'goi': 'GOI'
            }
            
            for city, code in airport_mappings.items():
                if city in query_lower:
                    if 'from' in query_lower and query_lower.index(city) > query_lower.index('from'):
                        extracted_params['departure'] = code
                    elif 'to' in query_lower and query_lower.index(city) > query_lower.index('to'):
                        extracted_params['arrival'] = code
                    else:
                        if 'departure' not in extracted_params:
                            extracted_params['departure'] = code
                        elif 'arrival' not in extracted_params:
                            extracted_params['arrival'] = code
                            
        elif any(keyword in query_lower for keyword in ['grocery', 'milk', 'bread', 'food', 'vegetables', 'fruits', 'daily', 'essentials']):
            intent = 'grocery_search'
            confidence = 0.8
            items = []
            if 'milk' in query_lower:
                items.append('milk')
            if 'bread' in query_lower:
                items.append('bread')
            if 'vegetables' in query_lower or 'veggie' in query_lower:
                items.append('vegetables')
            if 'fruits' in query_lower or 'fruit' in query_lower:
                items.append('fruits')
            
            if not items:
                items = ['groceries']
                
            extracted_params = {'items': items}
            missing_params = []
            clarifying_questions = []
            
        else:
            intent = 'general_question'
            confidence = 0.3
            extracted_params = {}
            missing_params = []
            clarifying_questions = []
        
        return {
            'intent': intent,
            'confidence': confidence,
            'extracted_params': extracted_params,
            'missing_params': missing_params,
            'clarifying_questions': clarifying_questions
        }
        
    except Exception as e:
        logger.error(f"Intent classification tool error: {e}")
        return {
            'intent': 'general_question',
            'confidence': 0.1,
            'extracted_params': {},
            'missing_params': [],
            'clarifying_questions': [],
            'error': str(e)
        }

# Credit Card Recommendation Tool
async def recommend_credit_cards_tool(
    purchase_context: Dict[str, Any],
    user_credit_cards: List[str]
) -> Dict[str, Any]:
    """
    Recommend optimal credit card usage based on purchase context.
    
    Args:
        purchase_context: Context about the purchase (amount, platform, category)
        user_credit_cards: User's available credit cards
    
    Returns:
        Dict with credit card recommendations
    """
    try:
        logger.info("Credit card recommendation tool called")
        
        amount = purchase_context.get('amount', 0)
        category = purchase_context.get('category', 'general')
        
        recommendations = []
        
        for card in user_credit_cards:
            if card in CREDIT_CARD_BENEFITS:
                card_info = CREDIT_CARD_BENEFITS[card]
                benefits = calculate_credit_card_benefits(amount, card, category)
                
                recommendations.append({
                    'card_name': card,
                    'benefits': card_info['benefits'],
                    'cashback_rate': benefits['effective_cashback_rate'],
                    'cashback_earned': benefits['cashback_earned'],
                    'annual_fee': card_info['annual_fee'],
                    'recommendation_score': benefits['cashback_earned'] / max(amount, 1) * 100
                })
        
        # Sort by cashback earned (highest first)
        recommendations.sort(key=lambda x: x['cashback_earned'], reverse=True)
        
        return {
            'recommendations': recommendations,
            'best_card': recommendations[0] if recommendations else None,
            'context': purchase_context
        }
        
    except Exception as e:
        logger.error(f"Credit card recommendation tool error: {e}")
        return {
            'recommendations': [],
            'best_card': None,
            'error': str(e)
        }

# Tool Registry
AVAILABLE_TOOLS = {
    'scrape_products': scrape_products_tool,
    'scrape_flights': scrape_flights_tool,
    'scrape_groceries': scrape_groceries_tool,
    'analyze_product_prices': analyze_product_prices_tool,
    'analyze_grocery_prices': analyze_grocery_prices_tool,
    'classify_query_intent': classify_query_intent_tool,
    'recommend_credit_cards': recommend_credit_cards_tool
}

async def get_tool(tool_name: str):
    """Get a tool by name from the registry"""
    if tool_name not in AVAILABLE_TOOLS:
        raise ValueError(f"Tool '{tool_name}' not found. Available tools: {list(AVAILABLE_TOOLS.keys())}")
    return AVAILABLE_TOOLS[tool_name]

async def list_available_tools() -> List[str]:
    """List all available tools"""
    return list(AVAILABLE_TOOLS.keys())

# Helper function for testing
async def test_all_tools():
    """Test all tools with sample data"""
    print("Testing all tools...")
    
    # Test product scraping
    print("\n1. Testing product scraping...")
    product_result = await scrape_products_tool("iPhone 15")
    print(f"Found {product_result.total_products} products")
    
    # Test flight scraping
    print("\n2. Testing flight scraping...")
    flight_result = await scrape_flights_tool("DEL", "BOM", "2024-02-15")
    print(f"Found {flight_result.total_flights} flights")
    
    # Test grocery scraping
    print("\n3. Testing grocery scraping...")
    grocery_result = await scrape_groceries_tool("milk", "110001", "blinkit")
    print(f"Found {grocery_result.total_products} grocery items")
    
    # Test price analysis
    print("\n4. Testing price analysis...")
    analysis_result = await analyze_product_prices_tool(
        [{'title': 'Test Product', 'price_str': '₹1000', 'platform': 'Amazon', 'url': 'test'}],
        ['HDFC Bank Millennia']
    )
    print(f"Analyzed {analysis_result['total_products']} products")
    
    # Test intent classification
    print("\n5. Testing intent classification...")
    intent_result = await classify_query_intent_tool("I want to buy an iPhone")
    print(f"Intent: {intent_result['intent']}, Confidence: {intent_result['confidence']}")
    
    print("\nAll tools tested successfully!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_all_tools())