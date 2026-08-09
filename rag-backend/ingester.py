import json
from typing import Dict, Any, List
from database import get_collection

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """Splits product description & specifications into manageable vector chunks."""
    if not text:
        return []
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
        i += (chunk_size - overlap)
    return chunks or [text]

def process_and_upsert_product(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses WooCommerce product webhook payload, extracts metadata (Name, Price, Category,
    Description, Specifications), chunks the text, and upserts vectors into ChromaDB.
    """
    collection = get_collection()

    product_id = str(product_data.get("id", f"prod_{product_data.get('name', 'unknown')}"))
    name = product_data.get("name", "Modena Culinary Product")
    price = product_data.get("price", "N/A")
    category = product_data.get("category", "Kitchenware & Appliances")
    description = product_data.get("description", "")
    specs = product_data.get("specifications", "")
    sku = product_data.get("sku", "")
    permalink = product_data.get("permalink", "")

    # Combine into a structured representation for document embedding
    full_text = (
        f"Product Name: {name}\n"
        f"Category: {category}\n"
        f"Price: ₹{price}\n"
        f"SKU: {sku}\n"
        f"Description: {description}\n"
        f"Specifications: {specs}"
    )

    chunks = chunk_text(full_text, chunk_size=300, overlap=40)

    ids = []
    documents = []
    metadatas = []

    for index, chunk in enumerate(chunks):
        doc_id = f"{product_id}_chunk_{index}"
        ids.append(doc_id)
        documents.append(chunk)
        metadatas.append({
            "product_id": str(product_id),
            "name": str(name),
            "price": str(price),
            "category": str(category),
            "chunk_index": index,
            "sku": str(sku),
            "permalink": str(permalink)
        })

    # Delete existing vectors for this product ID if re-indexing
    try:
        collection.delete(where={"product_id": str(product_id)})
    except Exception:
        pass

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    return {
        "status": "success",
        "product_id": product_id,
        "name": name,
        "chunks_indexed": len(chunks)
    }
