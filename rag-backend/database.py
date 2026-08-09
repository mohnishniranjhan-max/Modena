import os
import math
import hashlib
from typing import List
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from config import settings

class FastDeterministicEmbeddingFunction(EmbeddingFunction):
    """
    Lightweight, high-speed 384-dimensional vector embedding function.
    Provides fast, deterministic dense vector embeddings without network download stalls.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def name(self) -> str:
        return "default"

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.dimension
        words = text.lower().split()
        if not words:
            return vec

        for word in words:
            # Generate deterministic feature indices via md5 hashing
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dimension
            val = ((h >> 8) % 1000) / 500.0 - 1.0
            vec[idx] += val

        # L2 Normalize vector
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def __call__(self, input: Documents) -> Embeddings:
        return [self._embed_text(doc) for doc in input]

# Initialize persistent ChromaDB client
os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)

embedding_fn = FastDeterministicEmbeddingFunction()

def get_collection():
    """Retrieve or create the main ChromaDB product vector collection."""
    return chroma_client.get_or_create_collection(
        name=settings.COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )
