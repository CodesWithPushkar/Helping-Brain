from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Literal

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI

import requests
import os

load_dotenv()

app = FastAPI()


NODE_URL = os.getenv("NODE_URL", "http://localhost:3000")

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="google/gemma-4-31b-it:free"
)


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    userId: int
    workspaceId: int
    pageId: int
    message: str
    history: List[ChatHistoryMessage] = []


SYSTEM_PROMPT = """
You are Helping Brain, an AI assistant for the user's personal notes.

Rules:
- Treat the user's notes as the primary source.
- Use retrieval tools whenever note information is needed.
- If the current note references another page, retrieve it before answering.
- Explain instead of copying.
- If information isn't in the notes, tell the user first, then answer using general knowledge.
- Never invent note contents.
"""


def build_agent(user_id: int, workspace_id: int):
    """
    Build a fresh agent scoped to a single request's user/workspace context.
    This avoids sharing mutable global state across concurrent requests.
    """

    @tool
    def get_notes(pageId: int):
        """
        Fetch a page from the user's workspace using its page ID.
        """
        res = requests.post(
            f"{NODE_URL}/api/ai/page",
            json={
                "pageId": pageId,
                "userId": user_id,
                "workspaceId": workspace_id,
            },
            timeout=15,
        )
        res.raise_for_status()
        return res.json()

    return create_agent(
        model=llm,
        tools=[get_notes],
        system_prompt=SYSTEM_PROMPT,
    )


@app.post("/chat")
def chat(data: ChatRequest):
    agent = build_agent(data.userId, data.workspaceId)

    messages = [{"role": m.role, "content": m.content} for m in data.history]

    messages.append(
        {
            "role": "user",
            "content": f"""
Current page id: {data.pageId}

Question:
{data.message}
""",
        }
    )

    try:
        response = agent.invoke({"messages": messages})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent failed: {exc}")

    return {
        "answer": response["messages"][-1].content
    }


@app.get("/")
def home():
    return {
        "message": "Helping Brain AI Backend Running"
    }