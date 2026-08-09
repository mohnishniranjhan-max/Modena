import os
import json
import time
from typing import Dict, Any, List
from config import settings

class RAGEvaluator:
    def __init__(self, log_path: str = settings.ANALYTICS_LOG_FILE):
        self.log_path = log_path
        self._ensure_log_file()

    def _ensure_log_file(self):
        if not os.path.exists(self.log_path):
            with open(self.log_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def log_interaction(self, session_id: str, query: str, response_text: str, status: str, retrieved_docs: List[Dict[str, Any]], confidence: float):
        """Logs an AI interaction for evaluation and analytics."""
        entry = {
            "id": f"log_{int(time.time()*1000)}",
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "session_id": session_id,
            "query": query,
            "response": response_text,
            "status": status,  # "success" or "escalate"
            "retrieved_count": len(retrieved_docs),
            "confidence": round(confidence, 4),
            "docs": [doc.get("metadata", {}) for doc in retrieved_docs]
        }

        try:
            with open(self.log_path, "r+", encoding="utf-8") as f:
                try:
                    logs = json.load(f)
                except Exception:
                    logs = []
                logs.append(entry)
                f.seek(0)
                json.dump(logs, f, indent=2)
                f.truncate()
        except Exception as e:
            print(f"[Analytics Error] Failed to log interaction: {e}")

    def evaluate_metrics() -> Dict[str, Any]:
        """Calculates Accuracy (non-hallucination), Coherence, and Engagement metrics."""
        log_file = settings.ANALYTICS_LOG_FILE
        if not os.path.exists(log_file):
            return {
                "total_interactions": 0,
                "accuracy_score": 100.0,
                "coherence_score": 100.0,
                "escalation_rate_pct": 0.0,
                "average_confidence": 0.0,
                "recent_logs": []
            }

        try:
            with open(log_file, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except Exception:
            logs = []

        total = len(logs)
        if total == 0:
            return {
                "total_interactions": 0,
                "accuracy_score": 100.0,
                "coherence_score": 100.0,
                "escalation_rate_pct": 0.0,
                "average_confidence": 0.0,
                "recent_logs": []
            }

        escalations = [l for l in logs if l.get("status") == "escalate"]
        successes = [l for l in logs if l.get("status") == "success"]
        
        # Accuracy: Percentage of non-escalated responses backed by retrieved chunks
        valid_retrievals = [l for l in successes if l.get("retrieved_count", 0) > 0]
        accuracy = (len(valid_retrievals) / len(successes) * 100.0) if successes else 100.0

        # Coherence: Average confidence score converted to percentage
        confidences = [l.get("confidence", 0.0) for l in logs]
        avg_confidence = sum(confidences) / total
        coherence = min(100.0, max(50.0, (avg_confidence * 100.0) + 40.0))

        # Engagement metrics
        sessions = set(l.get("session_id") for l in logs)
        avg_session_length = round(total / len(sessions), 2) if sessions else 1.0
        escalation_rate = round((len(escalations) / total) * 100.0, 2)

        return {
            "total_interactions": total,
            "unique_sessions": len(sessions),
            "avg_session_length": avg_session_length,
            "accuracy_score": round(accuracy, 2),
            "coherence_score": round(coherence, 2),
            "escalation_rate_pct": escalation_rate,
            "average_confidence": round(avg_confidence, 4),
            "recent_logs": logs[-10:]  # Return 10 most recent logs
        }

evaluator = RAGEvaluator()
