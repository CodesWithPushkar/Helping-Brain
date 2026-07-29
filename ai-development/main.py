from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI

import requests
import os

load_dotenv()

app = FastAPI()


NODE_URL = "http://localhost:3000"

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="google/gemma-4-31b-it:free"
)

class ChatRequest(BaseModel):
    userId: int
    workspaceId: int
    pageId: int
    message: str



CURRENT_USER_ID = None
CURRENT_WORKSPACE_ID = None


@tool
def get_notes(pageId: int):
    """
    Fetch a page from the user's workspace using its page ID.
    """

    res = requests.post(
        f"{NODE_URL}/api/ai/page",
        json={
            "pageId": pageId,
            "userId": CURRENT_USER_ID,
            "workspaceId": CURRENT_WORKSPACE_ID,
        },
    )

    res.raise_for_status()

    return res.json()



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


agent = create_agent(
    model=llm,
    tools=[get_notes],
    system_prompt=SYSTEM_PROMPT,
)

@app.post("/chat")
def chat(data: ChatRequest):

    global CURRENT_USER_ID
    global CURRENT_WORKSPACE_ID

    CURRENT_USER_ID = data.userId
    CURRENT_WORKSPACE_ID = data.workspaceId

    response = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": f"""
Current page id: {data.pageId}

Question:
{data.message}
"""
                }
            ]
        }
    )

    return {
        "answer": response["messages"][-1].content
    }


@app.get("/")
def home():
    return {
        "message": "Helping Brain AI Backend Running"
    }