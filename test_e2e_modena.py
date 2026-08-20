import urllib.request
import urllib.parse
import urllib.error
import json
import time
import sys

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_WP_URL = "http://modena.local"
BASE_FE_URL = "http://localhost:5173"
BASE_RAG_URL = "http://127.0.0.1:8000"

results = {
    "passed": 0,
    "failed": 0,
    "details": [],
    "bugs_found": []
}

def log_test(name, passed, message="", data=None):
    status = "PASS" if passed else "FAIL"
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
        results["bugs_found"].append(f"{name}: {message}")
    
    entry = {"name": name, "status": status, "message": message, "data": data}
    results["details"].append(entry)
    print(f"[{status}] {name} - {message}", flush=True)

def http_get(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ModenaAudit/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return 0, str(e)

def http_post_json(url, payload, headers=None, timeout=15):
    if headers is None:
        headers = {}
    headers['Content-Type'] = 'application/json'
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ModenaAudit/1.0'
    data = json.dumps(payload).encode('utf-8')
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return 0, str(e)

def http_head_or_get(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ModenaAudit/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return 0

print("="*70, flush=True)
print("STARTING MODENA WEBSITE END-TO-END AUDIT & TEST SUITE", flush=True)
print("="*70, flush=True)

# -------------------------------------------------------------
# 1. SERVICE BASELINE & HEALTH CHECK
# -------------------------------------------------------------
print("\n--- 1. SERVICE BASELINE & HEALTH CHECK ---", flush=True)
status_wp, body_wp = http_get(f"{BASE_WP_URL}/")
log_test("Service: WordPress Backend", status_wp in [200, 301, 302], f"Status: {status_wp}")

status_fe, body_fe = http_get(BASE_FE_URL)
log_test("Service: React Frontend (Vite)", status_fe == 200, f"Status: {status_fe}, Size: {len(body_fe)} bytes")

status_rag, body_rag = http_get(f"{BASE_RAG_URL}/health")
if status_rag != 200:
    status_rag, body_rag = http_get(f"{BASE_RAG_URL}/")
log_test("Service: RAG Backend (FastAPI)", status_rag in [200, 404], f"Status: {status_rag}")

# -------------------------------------------------------------
# 2. WOOCOMMERCE STORE API AUDIT
# -------------------------------------------------------------
print("\n--- 2. WOOCOMMERCE PRODUCT API & CATALOG ---", flush=True)
status_prod, body_prod = http_get(f"{BASE_WP_URL}/wp-json/wc/store/v1/products?per_page=100")
products = []
if status_prod == 200:
    try:
        products = json.loads(body_prod)
        log_test("API: Fetch Products", True, f"Retrieved {len(products)} products from WooCommerce Store API")
    except Exception as e:
        log_test("API: Fetch Products", False, f"JSON parse error: {e}")
else:
    log_test("API: Fetch Products", False, f"HTTP Status {status_prod}")

# -------------------------------------------------------------
# 3. CATEGORY CONSISTENCY & PRODUCT MAPPING
# -------------------------------------------------------------
print("\n--- 3. CATEGORY AUDIT ---", flush=True)
status_cat, body_cat = http_get(f"{BASE_WP_URL}/wp-json/wc/store/v1/products/categories?per_page=100")
categories = []
if status_cat == 200:
    try:
        categories = json.loads(body_cat)
        cat_names = [c["name"] for c in categories]
        expected_cats = ["Mixer Grinder", "Nutrimix", "Cookware"]
        all_expected_present = all(ec in cat_names for ec in expected_cats)
        no_extraneous = len(categories) <= 4 # 3 main + possibly Uncategorized
        log_test("Categories: Official 3 Categories Present", all_expected_present, f"Found: {cat_names}")
        log_test("Categories: No Extraneous Sub-categories", no_extraneous, f"Total category count: {len(categories)}")
    except Exception as e:
        log_test("Categories: Fetch Categories", False, f"JSON parse error: {e}")
else:
    log_test("Categories: Fetch Categories", False, f"HTTP Status {status_cat}")

# -------------------------------------------------------------
# 4. PRODUCT DATA CONSISTENCY CHECK (5 SELECTED PRODUCTS)
# -------------------------------------------------------------
print("\n--- 4. PRODUCT DATA CONSISTENCY CHECK ---", flush=True)
if products:
    sample_products = products[:5]
    for idx, p in enumerate(sample_products, 1):
        p_id = p.get("id")
        p_name = p.get("name")
        p_price = p.get("prices", {}).get("price")
        p_reg_price = p.get("prices", {}).get("regular_price")
        p_sale_price = p.get("prices", {}).get("sale_price")
        p_images = p.get("images", [])
        p_cats = [c["name"] for c in p.get("categories", [])]
        
        has_images = len(p_images) > 0
        has_price = p_price is not None and int(p_price) > 0
        has_cat = len(p_cats) > 0
        
        log_test(f"Product #{idx} Integrity (ID: {p_id})", has_images and has_price and has_cat, 
                 f"Name: {p_name[:35]}... | Price: Rs.{int(p_price)/100 if p_price else 0} | Images: {len(p_images)} | Cat: {p_cats}")

# -------------------------------------------------------------
# 5. PRODUCT IMAGES & MEDIA URL AUDIT
# -------------------------------------------------------------
print("\n--- 5. PRODUCT IMAGES & MEDIA AUDIT ---", flush=True)
image_checks_passed = 0
image_checks_failed = 0
checked_urls = set()

for p in products:
    for img in p.get("images", []):
        src = img.get("src")
        if src and src not in checked_urls:
            checked_urls.add(src)
            img_status = http_head_or_get(src)
            if img_status == 200:
                image_checks_passed += 1
            else:
                image_checks_failed += 1
                print(f"Broken Image URL: {src} -> Status {img_status}", flush=True)

log_test("Images: All Catalog Images HTTP 200 OK", image_checks_failed == 0, 
         f"Verified {image_checks_passed} image URLs (Failed: {image_checks_failed})")

# -------------------------------------------------------------
# 6. SEARCH FUNCTIONALITY
# -------------------------------------------------------------
print("\n--- 6. SEARCH FUNCTIONALITY ---", flush=True)
# Exact search
search_term_exact = "Blender"
status_s1, body_s1 = http_get(f"{BASE_WP_URL}/wp-json/wc/store/v1/products?search={search_term_exact}")
s1_prods = json.loads(body_s1) if status_s1 == 200 else []
log_test("Search: Keyword 'Blender'", len(s1_prods) > 0, f"Found {len(s1_prods)} matches")

# Cookware search
search_term_cook = "Kadai"
status_s2, body_s2 = http_get(f"{BASE_WP_URL}/wp-json/wc/store/v1/products?search={search_term_cook}")
s2_prods = json.loads(body_s2) if status_s2 == 200 else []
log_test("Search: Keyword 'Kadai'", len(s2_prods) > 0, f"Found {len(s2_prods)} matches")

# Non-existent search
search_term_none = "NonExistentAlienDeviceXYZ"
status_s3, body_s3 = http_get(f"{BASE_WP_URL}/wp-json/wc/store/v1/products?search={search_term_none}")
s3_prods = json.loads(body_s3) if status_s3 == 200 else []
log_test("Search: Non-Existent Item returns empty", len(s3_prods) == 0, f"Returns {len(s3_prods)} items gracefully")

# -------------------------------------------------------------
# 7. NATIVE PAYMENT GATEWAYS & METHODS API
# -------------------------------------------------------------
print("\n--- 7. PAYMENT METHODS ENDPOINT ---", flush=True)
status_pm, body_pm = http_get(f"{BASE_WP_URL}/wp-json/modena/v1/payment-methods")
if status_pm == 200:
    try:
        pm_data = json.loads(body_pm)
        pm_methods = pm_data.get("methods", [])
        pm_ids = [m.get("id") for m in pm_methods]
        cod_absent = "cod" not in pm_ids
        log_test("Payment Methods API", True, f"Active Gateways: {pm_ids}")
        log_test("Payment Methods: Cash on Delivery Disabled", cod_absent, f"COD present: {'cod' in pm_ids}")
    except Exception as e:
        log_test("Payment Methods API", False, f"JSON error: {e}")
else:
    log_test("Payment Methods API", False, f"HTTP Status {status_pm}")

# -------------------------------------------------------------
# 8. CHECKOUT & NATIVE ORDER CREATION FLOW
# -------------------------------------------------------------
print("\n--- 8. CHECKOUT & ORDER CREATION ---", flush=True)
if products:
    test_p1 = products[0]
    test_p2 = products[1] if len(products) > 1 else products[0]
    
    order_payload = {
        "customer": {
            "name": "Audit Tester",
            "email": "audit.test@example.com",
            "phone": "9876543210",
            "address": "123 Test Street, Cyber City, Bengaluru, Karnataka - 560001"
        },
        "items": [
            {
                "id": test_p1.get("id"),
                "name": test_p1.get("name"),
                "price": int(test_p1.get("prices", {}).get("price", 299900)) / 100,
                "quantity": 2
            },
            {
                "id": test_p2.get("id"),
                "name": test_p2.get("name"),
                "price": int(test_p2.get("prices", {}).get("price", 199900)) / 100,
                "quantity": 1
            }
        ],
        "payment_method": "bacs"
    }

    status_ord, body_ord = http_post_json(f"{BASE_WP_URL}/wp-json/modena/v1/create-wc-order", order_payload)
    if status_ord == 200:
        try:
            ord_res = json.loads(body_ord)
            ord_id = ord_res.get("order_id")
            ord_total = ord_res.get("total")
            log_test("Checkout: Order Creation (BACS)", ord_res.get("success") == True and ord_id is not None, 
                     f"Order #{ord_id} created successfully, Total: Rs.{ord_total}")
        except Exception as e:
            log_test("Checkout: Order Creation (BACS)", False, f"JSON error: {e}")
    else:
        log_test("Checkout: Order Creation (BACS)", False, f"HTTP Status {status_ord}: {body_ord}")

    # Test Validation: Missing customer email
    bad_payload = {
        "customer": {"name": "Incomplete User", "phone": "123"},
        "items": [{"id": test_p1.get("id"), "name": test_p1.get("name"), "quantity": 1, "price": 100}],
        "payment_method": "bacs"
    }
    status_bad, body_bad = http_post_json(f"{BASE_WP_URL}/wp-json/modena/v1/create-wc-order", bad_payload)
    log_test("Checkout: Validation on Incomplete Data", status_bad == 400, f"Rejected with 400 Bad Request as expected: {body_bad[:60]}")

# -------------------------------------------------------------
# 9. CHATBOT RAG ASSISTANT INTERACTION
# -------------------------------------------------------------
print("\n--- 9. CHATBOT RAG ASSISTANT AUDIT ---", flush=True)

# Chatbot Test 1: Basic Greeting
status_c1, body_c1 = http_post_json(f"{BASE_RAG_URL}/chat", {"message": "Hello!", "history": []})
c1_pass = False
if status_c1 == 200:
    try:
        res_c1 = json.loads(body_c1)
        resp_text = res_c1.get("message", "") or res_c1.get("response", "")
        c1_pass = len(resp_text) > 5
        log_test("Chatbot: Basic Greeting", c1_pass, f"Response: {resp_text[:60]}...")
    except Exception as e:
        log_test("Chatbot: Basic Greeting", False, f"JSON parse error: {e}")
else:
    log_test("Chatbot: Basic Greeting", False, f"HTTP Status {status_c1}: {body_c1}")

# Chatbot Test 2: Product Category Inquiry
status_c2, body_c2 = http_post_json(f"{BASE_RAG_URL}/chat", {"message": "What cookware products do you have?", "history": []})
c2_pass = False
if status_c2 == 200:
    try:
        res_c2 = json.loads(body_c2)
        resp_text = res_c2.get("message", "") or res_c2.get("response", "")
        c2_pass = any(w in resp_text.lower() for w in ["cookware", "tripro", "kadai", "cooker", "pan"])
        log_test("Chatbot: Cookware Query", c2_pass, f"Response: {resp_text[:80]}...")
    except Exception as e:
        log_test("Chatbot: Cookware Query", False, f"JSON error: {e}")
else:
    log_test("Chatbot: Cookware Query", False, f"HTTP Status {status_c2}")

# Chatbot Test 3: Specific Product Inquiry & Multi-Turn Follow-Up
status_c3, body_c3 = http_post_json(f"{BASE_RAG_URL}/chat", {
    "message": "What is the price of the Modena Nutri Bullet Blender?",
    "history": []
})
c3_pass = False
history_c3 = []
if status_c3 == 200:
    try:
        res_c3 = json.loads(body_c3)
        resp_text = res_c3.get("message", "") or res_c3.get("response", "")
        c3_pass = len(resp_text) > 10
        history_c3 = [
            {"role": "user", "content": "What is the price of the Modena Nutri Bullet Blender?"},
            {"role": "assistant", "content": resp_text}
        ]
        log_test("Chatbot: Product Specific Query", c3_pass, f"Response: {resp_text[:80]}...")
    except Exception as e:
        log_test("Chatbot: Product Specific Query", False, f"JSON error: {e}")

# Multi-Turn Follow-up
status_c4, body_c4 = http_post_json(f"{BASE_RAG_URL}/chat", {
    "message": "What jars or components are included in the box with it?",
    "history": history_c3
})
c4_pass = False
if status_c4 == 200:
    try:
        res_c4 = json.loads(body_c4)
        resp_text = res_c4.get("message", "") or res_c4.get("response", "")
        c4_pass = len(resp_text) > 10
        log_test("Chatbot: Multi-turn Follow-up Context", c4_pass, f"Response: {resp_text[:80]}...")
    except Exception as e:
        log_test("Chatbot: Multi-turn Follow-up Context", False, f"JSON error: {e}")

# Unknown query
status_c5, body_c5 = http_post_json(f"{BASE_RAG_URL}/chat", {
    "message": "Do you sell rocket fuel for spacecraft?",
    "history": []
})
c5_pass = False
if status_c5 == 200:
    try:
        res_c5 = json.loads(body_c5)
        resp_text = res_c5.get("message", "") or res_c5.get("response", "")
        c5_pass = len(resp_text) > 5
        log_test("Chatbot: Unknown / Unrelated Query Graceful Handling", c5_pass, f"Response: {resp_text[:80]}...")
    except Exception as e:
        log_test("Chatbot: Unknown Query", False, f"JSON error: {e}")

# -------------------------------------------------------------
# SUMMARY REPORT
# -------------------------------------------------------------
print("\n" + "="*70, flush=True)
print(f"AUDIT COMPLETE: {results['passed']} PASSED, {results['failed']} FAILED", flush=True)
print("="*70, flush=True)

with open("audit_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

sys.exit(0 if results['failed'] == 0 else 1)
