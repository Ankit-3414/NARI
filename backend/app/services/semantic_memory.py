"""Semantic Memory service using Sentence Transformers and sqlite-vec."""

from typing import List, Optional
import json

from sqlmodel import Session, select
import sqlalchemy as sa
from sentence_transformers import SentenceTransformer

from ..models.knowledge import KnowledgeNode
from ..db.session import engine


class SemanticMemoryService:
    def __init__(self):
        # We load a small, fast model for CPU inference. 
        # This only happens once when the service starts.
        self.model_name = "all-MiniLM-L6-v2"
        self._model = None

    def _get_model(self):
        if self._model is None:
            # Lazy load to avoid slowing down API startup if not needed immediately
            print(f"Loading embedding model: {self.model_name}...")
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a 384-dimensional vector embedding for the given text."""
        model = self._get_model()
        # Ensure it's a standard python float list
        return model.encode(text).tolist()

    def store_knowledge(
        self, 
        session: Session, 
        concept: str, 
        summary: str, 
        raw_content: Optional[str] = None, 
        source: str = "autonomous_research"
    ) -> KnowledgeNode:
        """Stores a new knowledge node and its vector embedding."""
        
        # 1. Create or update the relational node
        statement = select(KnowledgeNode).where(KnowledgeNode.concept == concept)
        node = session.exec(statement).first()
        
        if not node:
            node = KnowledgeNode(
                concept=concept,
                summary=summary,
                raw_content=raw_content,
                source=source,
                confidence=0.8 # Initial confidence
            )
            session.add(node)
            session.flush() # Get the ID
        else:
            node.summary = summary
            node.raw_content = raw_content
            node.source = source
            session.add(node)
            session.flush()

        # 2. Generate embedding from the concept and summary combined
        text_to_embed = f"Concept: {concept}\nSummary: {summary}"
        embedding = self.generate_embedding(text_to_embed)
        
        # 3. Store the embedding in the sqlite-vec virtual table
        # We must serialize the float list to JSON for vec0 insertion in Python sqlite3 bindings
        vector_json = json.dumps(embedding)
        
        # Virtual tables in sqlite-vec don't support UPSERT, so we delete then insert
        session.execute(
            sa.text("DELETE FROM knowledge_nodes_vec WHERE rowid = :rowid"),
            {"rowid": node.id}
        )
        session.execute(
            sa.text("""
                INSERT INTO knowledge_nodes_vec(rowid, embedding) 
                VALUES (:rowid, :embedding)
            """),
            {"rowid": node.id, "embedding": vector_json}
        )
        
        session.commit()
        session.refresh(node)
        return node

    def search_knowledge(self, session: Session, query: str, limit: int = 3) -> List[KnowledgeNode]:
        """Search the knowledge graph using semantic vector similarity."""
        query_embedding = self.generate_embedding(query)
        vector_json = json.dumps(query_embedding)
        
        # sqlite-vec uses knn search
        statement = select(KnowledgeNode).from_statement(sa.text("""
            SELECT kn.*
            FROM knowledge_nodes_vec kv
            JOIN knowledge_nodes kn ON kv.rowid = kn.id
            WHERE kv.embedding MATCH :query_vector AND k = :limit
        """)).params(query_vector=vector_json, limit=limit)
        
        results = session.exec(statement).all()
        
        nodes = []
        for r in results:
            # r could be a Row object or a tuple containing the KnowledgeNode
            try:
                # Try to unpack if it's a tuple-like Row
                node = r[0]
            except Exception:
                node = r
            nodes.append(node)
        return nodes


semantic_memory = SemanticMemoryService()
