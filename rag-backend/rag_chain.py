import os
import re
from typing import Dict, Any, List, Tuple
from database import get_collection
from config import settings
from evaluator import evaluator

# Session Memory Store: Dict[session_id, List[Dict[role, content]]]
SESSION_MEMORY: Dict[str, List[Dict[str, str]]] = {}

SYSTEM_PROMPT = (
    "You are the Modena Shopping Assistant. Answer questions based ONLY on the retrieved product context. "
    "Do not invent products or prices. Be concise, polite, and helpful."
)

HUMAN_KEYWORDS = [
    "human", "agent", "support team", "representative", "customer service",
    "talk to person", "real person", "escalate", "complain", "refund issue", "manager"
]

def get_session_history(session_id: str) -> List[Dict[str, str]]:
    """Retrieves session history, enforcing maximum memory length."""
    if session_id not in SESSION_MEMORY:
        SESSION_MEMORY[session_id] = []
    return SESSION_MEMORY[session_id]

def add_session_message(session_id: str, role: str, content: str):
    """Appends a message to session buffer memory."""
    history = get_session_history(session_id)
    history.append({"role": role, "content": content})
    if len(history) > settings.MAX_SESSION_HISTORY * 2:
        SESSION_MEMORY[session_id] = history[-settings.MAX_SESSION_HISTORY * 2:]

def calculate_confidence(distances: List[float]) -> float:
    """Converts ChromaDB cosine/euclidean distance scores to confidence (0.0 to 1.0)."""
    if not distances:
        return 0.0
    min_dist = min(distances)
    # Cosine distance ranges from 0 (exact match) to 1+ (dissimilar)
    confidence = max(0.0, 1.0 - min_dist)
    return round(confidence, 4)

GREETING_KEYWORDS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "who are you", "help", "what can you do"]

def check_human_escalation_trigger(query: str, confidence: float, retrieved_docs: List[Dict[str, Any]]) -> Tuple[bool, str]:
    """Determines whether query must be escalated to a human expert."""
    lower_query = query.lower().strip()

    # 1. Explicit user request for human customer service
    for keyword in HUMAN_KEYWORDS:
        if keyword in lower_query:
            return True, f"User explicitly requested human assistance (matched '{keyword}')."

    # Only escalate if query explicitly asks for non-product human support
    return False, ""

def format_context(documents: List[str], metadatas: List[Dict[str, Any]]) -> str:
    """Formats retrieved vector document chunks into clean prompt context."""
    formatted_chunks = []
    for doc, meta in zip(documents, metadatas):
        p_name = meta.get("name", "Product")
        p_price = meta.get("price", "N/A")
        p_cat = meta.get("category", "")
        formatted_chunks.append(f"[{p_name} | Price: ₹{p_price} | Cat: {p_cat}]\n{doc}")
    return "\n---\n".join(formatted_chunks)

def answer_query_with_rag(session_id: str, query: str) -> Dict[str, Any]:
    """
    Main RAG Chat Assistant Handler:
    1. Embeds user query & performs similarity search (top-k=4) in ChromaDB.
    2. Evaluates distance confidence score.
    3. Checks for Escalate-to-Human logic triggers.
    4. Formulates grounded response using retrieved context and session memory.
    """
    collection = get_collection()

    # Perform top_k similarity search
    results = collection.query(
        query_texts=[query],
        n_results=settings.TOP_K,
        include=["documents", "metadatas", "distances"]
    )

    documents = results["documents"][0] if results.get("documents") else []
    metadatas = results["metadatas"][0] if results.get("metadatas") else []
    distances = results["distances"][0] if results.get("distances") else []

    retrieved_items = [
        {"document": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(documents, metadatas, distances)
    ]

    confidence = calculate_confidence(distances)

    # Check Escalation
    should_escalate, reason = check_human_escalation_trigger(query, confidence, retrieved_items)

    if should_escalate:
        escalate_payload = {
            "status": "escalate",
            "message": "I need to connect you with a human expert.",
            "reason": reason,
            "session_id": session_id,
            "confidence": confidence
        }
        # Log analytics
        evaluator.log_interaction(
            session_id=session_id,
            query=query,
            response_text=escalate_payload["message"],
            status="escalate",
            retrieved_docs=retrieved_items,
            confidence=confidence
        )
        return escalate_payload

    # Check if query is a greeting or general question
    lower_query = query.lower().strip()
    is_greeting = any(g in lower_query for g in GREETING_KEYWORDS) or len(lower_query) < 4

    if is_greeting or not documents:
        response_text = (
            "Hello! I am your Modena AI Shopping Assistant. 👋\n\n"
            "I can help you explore our premium kitchen appliances, pressure cookers, mixer grinders, and cookware. "
            "What product or feature are you looking for today?"
        )
    else:
        # Construct Grounded Response Synthesizer
        top_product = metadatas[0] if metadatas else {}
        prod_name = top_product.get("name", "our kitchenware item")
        prod_price = top_product.get("price", "N/A")
        prod_cat = top_product.get("category", "")

        # Build response directly grounded on retrieved context
        response_text = (
            f"Based on our Modena catalog for **{prod_name}** ({prod_cat}):\n"
            f"• **Price**: ₹{prod_price}\n"
            f"• **Details**: {documents[0]}\n\n"
            f"Would you like to add this to your cart or need specific details on warranty or features?"
        )

    # Add to memory
    add_session_message(session_id, "user", query)
    add_session_message(session_id, "assistant", response_text)

    # Log analytics
    evaluator.log_interaction(
        session_id=session_id,
        query=query,
        response_text=response_text,
        status="success",
        retrieved_docs=retrieved_items,
        confidence=confidence
    )

    return {
        "status": "success",
        "message": response_text,
        "session_id": session_id,
        "confidence": confidence,
        "retrieved_products": [
            {
                "id": meta.get("product_id"),
                "name": meta.get("name"),
                "price": meta.get("price"),
                "category": meta.get("category")
            }
            for meta in metadatas
        ]
    }
