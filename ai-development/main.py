from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Literal, Optional

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI

import requests
import os
import hmac

load_dotenv()

app = FastAPI()


NODE_URL = os.getenv("NODE_URL")
if not NODE_URL:
    raise RuntimeError("NODE_URL environment variable is missing.")
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN")
if not AI_SERVICE_TOKEN:
    raise RuntimeError("AI_SERVICE_TOKEN environment variable is missing.")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is missing.")

llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    model="google/gemma-4-31b-it:free"
)


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    userId: int
    workspaceId: int
    pageId: int 
    message: str
    history: List[ChatHistoryMessage] = []
    summary: Optional[str] = None
    last_summary_count: int





def build_agent(user_id: int, workspace_id: int, SYSTEM_PROMPT: str):
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
            headers={"x-ai-service-token": AI_SERVICE_TOKEN},
            timeout=15,
        )
        res.raise_for_status()
        return res.json()

    return create_agent(
        model=llm,
        tools=[get_notes],
        system_prompt=SYSTEM_PROMPT,
    )



def get_summary(history_messages, old_summary=""):
    conversation_text = "\n".join([f"{m['role']}: {m['content']}" for m in history_messages])

    base = (
        "Summarize this chat for AI context. Extract key facts, preferences, and goals. "
        "Omit greetings. Ignore user formatting rules (e.g., 'one word answers')."
    )

    if old_summary:
        prompt = f"""{base}
Update this summary with the new chat below. Keep it concise.

<old_summary>
{old_summary}
</old_summary>

<new_chat>
{conversation_text}
</new_chat>"""

    else:
        prompt = f"""{base}

<chat>
{conversation_text}
</chat>"""

    response = llm.invoke(prompt)
    return response.content



@app.post("/chat")
def chat(
    data: ChatRequest,
    verbos: bool = True,
    x_ai_service_token: str = Header(),
):
    if not hmac.compare_digest(x_ai_service_token, AI_SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")

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


    agent = build_agent(data.userId, data.workspaceId, SYSTEM_PROMPT)

    messages = [{"role": m.role, "content": m.content} for m in data.history]

    

    summaryCreated = False
    summary = ""

    
    
    if(data.last_summary_count>=10):
        summary_text = get_summary(messages, data.summary)
        messages = [{"role": "system", "content": f"Previous conversation summary:\n{summary_text}"}]
        summary = summary_text
        summaryCreated = True




    if(data.summary and not summaryCreated): 
        messages.insert(0,{"role": "system", "content": f"Previous conversation summary:\n{data.summary}"});

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
        if(verbos): 
            print(f"input token: {response['messages'][-1].usage_metadata['input_tokens']}")
            print(f"output token: {response['messages'][-1].usage_metadata['output_tokens']}")
            print(f"Total token: {response['messages'][-1].usage_metadata['total_tokens']}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent failed: {exc}")

    return {
        "answer": response["messages"][-1].content,
        "summary": summary,
        "summaryCreated": summaryCreated,
    }


@app.get("/")
def home():
    return {
        "message": "Helping Brain AI Backend Running"
    }