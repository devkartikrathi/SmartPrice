import requests
import json
import time

API_KEY = "yrVZ5WbefYROUjgmjLtBx3Yw0W3Loz2a"
BASE_URL = "http://15.235.85.18:8005/quickcommerce/data"
PINCODE = "110053"

# 50 general grocery products
PRODUCTS = [
    "milk", "bread", "egg", "butter", "cheese", "paneer", "curd", "yogurt", "toor dal",
    "moong dal", "chana dal", "masoor dal", "urad dal", "basmati rice", "brown rice",
    "wheat flour", "multigrain atta", "maida", "sugar", "salt",
    "turmeric", "coriander powder", "garam masala", "tea",
    "coffee", "biscuits", "noodles", "pasta", "oil", "ghee", "honey", "jam", "ketchup",
    "soap", "shampoo", "toothpaste", "washing powder", "dishwash liquid",
    "chips", "chocolates", "cold drink", "juice", "onion", "potato", "tomato", "apple"
]

def fetch_data(platform, keywords):
    results = {}
    for i, keyword in enumerate(keywords, start=1):
        params = {
            "apikey": API_KEY,
            "platform": platform,
            "pincode": PINCODE,
            "keyword": keyword
        }
        try:
            response = requests.get(BASE_URL, params=params, timeout=120)
            response.raise_for_status()
            data = response.json()

            if platform == "blinkit":
                results[keyword] = data.get("data", {})
            elif platform == "zepto":
                results[keyword] = data.get("data", {})

            print(f"[{platform.upper()}] ({i}/{len(keywords)}) Collected for keyword: {keyword}")

        except Exception as e:
            print(f"Error fetching {keyword} from {platform}: {e}")
            results[keyword] = {"error": str(e)}

        # small delay to avoid hammering API
        time.sleep(1)

    return results

if __name__ == "__main__":
    # Fetch for Blinkit
    blinkit_data = fetch_data("blinkit", PRODUCTS)
    with open("blinkit_data.json", "w", encoding="utf-8") as f:
        json.dump(blinkit_data, f, indent=4, ensure_ascii=False)

    # Fetch for Zepto
    zepto_data = fetch_data("zepto", PRODUCTS)
    with open("zepto_data.json", "w", encoding="utf-8") as f:
        json.dump(zepto_data, f, indent=4, ensure_ascii=False)

    print("✅ Data collection complete! Files saved: blinkit_data.json, zepto_data.json")
