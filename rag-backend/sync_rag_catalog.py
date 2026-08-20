import urllib.request
import json
import os
import sys

# Change directory to rag-backend so relative imports work
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ingester import process_and_upsert_product

print("Fetching products from WooCommerce Store API...")
req = urllib.request.Request("http://modena.local/wp-json/wc/store/v1/products?per_page=100", headers={"User-Agent": "RAGSync/1.0"})
with urllib.request.urlopen(req) as res:
    products = json.loads(res.read().decode("utf-8"))

print(f"Syncing {len(products)} products into ChromaDB Vector Store...")
for p in products:
    p_id = p.get("id")
    name = p.get("name")
    price_cents = p.get("prices", {}).get("price", "0")
    price = str(int(price_cents) / 100) if price_cents else "0"
    categories = ", ".join([c["name"] for c in p.get("categories", [])])
    description = p.get("description", "")
    short_desc = p.get("short_description", "")
    sku = p.get("sku", "")
    permalink = p.get("permalink", "")

    product_payload = {
        "id": str(p_id),
        "name": name,
        "price": price,
        "category": categories,
        "description": f"{short_desc}\n{description}",
        "specifications": f"Category: {categories}, SKU: {sku}",
        "sku": sku,
        "permalink": permalink
    }

    res = process_and_upsert_product(product_payload)
    print(f"Indexed: {name} (Price: Rs.{price}) -> {res.get('chunks_indexed')} chunks")

print("RAG Vector Database sync completed successfully!")
