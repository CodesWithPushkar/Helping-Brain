import express, {type NextFunction, type Request, type Response} from 'express'
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import path from 'path';
import 'dotenv/config';
import cors from 'cors';
import { fileURLToPath } from 'url'
import { prisma } from './prismaClient.js';
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { z } from 'zod';
import axios from 'axios';


const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],              
}));

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const JWT_SECRET = process.env.JWT_SECRET!; 

if(!GOOGLE_CLIENT_ID) throw new Error('FATAL: GOOGLE_CLIENT_ID environment variable is missing.');

const client = new OAuth2Client('GOOGLE_CLIENT_ID');


const workspaceSchema = z.object({
  name: z.string().min(1, { message: "Name is required and cannot be empty" })
});

const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.any().optional(), 
});

const pageSchema = z.object({
  title: z.string().min(1, { message: "Title is required and cannot be empty" }),
  workspaceId: z.coerce.number().int(),
  parentPageId: z.coerce.number().int().nullable(),
  icon: z.string(),
  color: z.string()
});

const getPageAiSchema = z.object({
  userId: z.number(),
  workspaceId: z.number(),
  pageId: z.number(),
});

const chatSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty" }),
  page_id: z.coerce.number().int(),
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";




app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try{

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload: TokenPayload | undefined = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const { sub, email, name, picture } = payload;

    const user = await prisma.user.upsert({
      where: {
        sub: sub
      },
      update: {},
      create: {
        email: email!,
        name: name!,
        picture_url: picture!,
        sub: sub!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      select: {
        email: true
      }
    });

    const jwtToken = jwt.sign({
      email: user.email
    }, JWT_SECRET);


    res.status(200).json({
      token: jwtToken
    });

  }catch(error){
    console.error('Error verifying Google token:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});



const auth = (req:Request, res: Response, next:NextFunction) => {
  const authToken = req.header('Authorization');

  if (!authToken) {
      return res.status(400).json({ error: 'Token is required in request body.' });
  }

  try{

    const decoded = jwt.verify(authToken, JWT_SECRET) as JwtPayload;

    if (!decoded.email) {
      return res.status(401).json({ error: 'Malformed token payload.' });
    }

    req.email = decoded.email;
    next();

  }catch(error){
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

}

app.post('/api/create/workspace', auth, async (req, res) => {
  const email = req.email;
  const result = workspaceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
    });
  }

  if(!email){
    return res.status(401).json({ error: 'Internal error' });
  }

  try{


    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        id: true
      }
    })

    if(!user){
      return res.status(401).json({ error: 'User not found' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: result.data.name,
        owner_id: user?.id
      }
    })

    return res.status(200).json({ workspace });
  
  }catch(error){
    return res.status(401).json({ error: 'Internal server error' });
  }
  
  
});



app.post('/api/create/page', auth, async (req,res) => {
  const email = req.email;
  const result = pageSchema.safeParse(req.body);
  if (!result.success) {
    console.log(result.error.format());
    return res.status(400).json({ error: result.error.format() });
  }

  if(!email){
    return res.status(401).json({ error: 'Internal error' });
  }

  try{

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: result.data.workspaceId
      }
    })

    if(!workspace){
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    let createdPage;

    if(!result.data.parentPageId){
      createdPage = await prisma.page.create({
        data: {
          title: result.data.title,
          workspace_id: result.data.workspaceId,
          icon: result.data.icon,
          color: result.data.color
        },
        include: {
          _count: {
            select: { children: true }
          }
        }
      });
    }
    else{
      const parentPage = await prisma.page.findFirst({
        where: {
          id: result.data.parentPageId,
          workspace_id: result.data.workspaceId
        }
      })

      if(!parentPage) return res.status(403).json({ error: 'Forbidden' });
      createdPage = await prisma.page.create({
        data: {
          title: result.data.title,
          workspace_id: result.data.workspaceId,
          parent_page_id: parentPage.id,
          icon: result.data.icon,
          color: result.data.color
        },
        include: {
          _count: {
            select: { children: true }
          }
        }
      });

    }

    

    return res.status(200).json({ page: createdPage });

  }catch(error){
    return res.status(500).json({ error: 'Internal server error' });
  }


});


app.get("/api/user", auth, async (req, res) => {
  const email = req.email;
  if(!email){
    return res.status(401).json({ error: 'Internal error' });
  }
  try{

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if(!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({
      user
    });

  }catch(error){
    return res.status(401).json({ error: 'Internal server error' });
  }

})

app.get("/api/workspace", auth, async (req, res) => {
  const email = req.email;
  if(!email){
    return res.status(401).json({ error: 'Internal error' });
  }

  try{

    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        id: true
      }
    });

    if(!user) {
      return res.status(403).json({ error: 'Forbidden' });
    }


    const workspaces = await prisma.workspace.findMany({
      where: {
        owner_id: user.id,
        is_deleted: false
      },
      include: {
        pages: {
          where: {
            is_deleted: false
          },
          include: {
            _count: {
              select: {
                children: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      workspaces
    })
  }catch(error){
    return res.status(401).json({ error: 'Internal server error' });
  }
});


app.get("/api/page/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  try {

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return res.status(401).json({ error: "Internal error" });

    const page = await prisma.page.findFirst({
      where: { 
        id: Number(req.params.id),
        workspace: {
          owner_id: user.id
        }
       },
    });

    if (!page) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({ page });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/notes/search", auth, async(req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const { q, workspaceId } = req.query;

  if(!q || typeof q!=='string'){
    return res.status(400).json({ error: 'Search query is required' });
  }

  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }


  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: Number(workspaceId)
      }
    });

    if(!workspace){
      return res.status(403).json({
        error: "No workspace found with this id"
      });
    }


    const notes = await prisma.page.findMany({
      where: {
        workspace_id: Number(workspaceId),
        title: {
          contains: q,
          mode: 'insensitive'
        }
      }
    });

    console.log(notes);

    return res.status(200).json(notes);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/pages", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const workspaceId = Number(req.query.workspaceId);
  if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Internal error" });

    const pages = await prisma.page.findMany({
      where: {
        workspace_id: workspaceId,
        workspace: { owner_id: user.id },
      },
      select: { id: true, title: true },
    });

    return res.status(200).json({ pages });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});




app.get("/api/ai/chats", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const page_id = Number(req.query.page_id);
  if (!Number.isInteger(page_id)) {
    return res.status(400).json({ error: "Invalid page_id" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return res.status(401).json({ error: "Internal error" });

    const page = await prisma.page.findFirst({
      where: { id: page_id, workspace: { owner_id: user.id } },
      select: { id: true },
    });
    if (!page) return res.status(403).json({ error: "Forbidden" });

    const chats = await prisma.chat.findMany({
      where: { page_id },
      orderBy: { created_at: "desc" },
      select: { id: true, title: true, created_at: true },
    });

    return res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An internal server error occurred while fetching chats.",
    });
  }
});

app.get("/api/ai/chat/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid chat id" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return res.status(401).json({ error: "Internal error" });

    const chat = await prisma.chat.findFirst({
      where: { id, page: { workspace: { owner_id: user.id } } },
      include: { messages: { orderBy: { id: "asc" } } },
    });
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    return res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An internal server error occurred while fetching the chat.",
    });
  }
});




app.post("/api/ai/page", async (req, res) => {
  const result = getPageAiSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: result.error.format(),
    });
  }

  const { userId, workspaceId, pageId } = result.data;

  try {
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        workspace: {
          id: workspaceId,
          owner_id: userId,
        },
      },
    });

    if (!page) {
      return res.status(404).json({
        error: "Page not found",
      });
    }

    return res.status(200).json(page);
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});


app.post("/api/ai/newchat", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.format(),
    });
  }

  const { message, page_id } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return res.status(401).json({ error: "Internal error" });

    const page = await prisma.page.findFirst({
      where: {
        id: page_id,
        workspace: { owner_id: user.id },
      },
      select: { id: true, workspace_id: true },
    });

    if (!page) return res.status(403).json({ error: "Forbidden" });

    const cleanText = message.replace(/[#_*~`]/g, "").trim();
    const words = cleanText.split(/\s+/);
    let title = words.slice(0, 5).join(" ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (words.length > 5) {
      title += "...";
    }

    const newChat = await prisma.chat.create({
      data: {
        title: title,
        page_id: page_id,
        messages: {
          create: {
            role: "user",
            content: message
          }
        }
      },
      include: {
        messages: true
      }
    });

    let aiText: string;
    try {
      const llmRes = await axios.post(`${AI_SERVICE_URL}/chat`, {
        userId: user.id,
        workspaceId: page.workspace_id,
        pageId: page_id,
        message,
        history: [],
      });

      aiText = llmRes.data.answer;
    } catch (aiError) {
      console.error("AI service error:", aiError);
      aiText = "Sorry, I couldn't reach the assistant just now. Please try again.";
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        role: "assistant",
        content: aiText,
        chat_id: newChat.id,
      },
    });

    return res.status(201).json({
      success: true,
      chat: {
        ...newChat,
        messages: [...newChat.messages, assistantMessage],
      },
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "An internal server error occurred while creating the chat." 
    });
  }
});


app.post("/api/ai/chat/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid chat id" });
  }

  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.format(),
    });
  }

  const { message, page_id } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return res.status(401).json({ error: "Internal error" });

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        page: { workspace: { owner_id: user.id } },
      },
      include: {
        messages: { orderBy: { id: "asc" } },
        page: { select: { workspace_id: true } },
      },
    });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const userMessage = await prisma.chatMessage.create({
      data: {
        role: "user",
        content: message,
        chat_id: chat.id,
      },
    });

    const history = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let aiText: string;
    try {
      const llmRes = await axios.post(`${AI_SERVICE_URL}/chat`, {
        userId: user.id,
        workspaceId: chat.page.workspace_id,
        pageId: page_id,
        message,
        history,
      });
      aiText = llmRes.data.answer;
    } catch (aiError) {
      console.error("AI service error:", aiError);
      aiText = "Sorry, I couldn't reach the assistant just now. Please try again.";
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        role: "assistant",
        content: aiText,
        chat_id: chat.id,
      },
    });

    return res.status(200).json({
      success: true,
      userMessage,
      assistantMessage,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: "An internal server error occurred while adding the message." 
    });
  }
});


app.patch("/api/page/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });

  const result = updatePageSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  try {
    const updated = await prisma.page.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(result.data.title !== undefined && { title: result.data.title }),
        ...(result.data.content !== undefined && { content: result.data.content }),
      },
    });

    return res.status(200).json({ page: updated });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/api/workspace/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });
  try {
    const id = Number(req.params.id);
    const update = await prisma.workspace.update({
      where: {
        id
      },
      data: {
        is_deleted: true
      }
    })


    res.status(200).json({
      update
    })
    
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/api/page/:id", auth, async (req, res) => {
  const email = req.email;
  if (!email) return res.status(401).json({ error: "Internal error" });
  try {
    const id = Number(req.params.id);
    const update = await prisma.page.update({
      where: {
        id
      },
      data: {
        is_deleted: true
      }
    })


    res.status(200).json({
      update
    })
    
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});




app.listen(port, () => {
  console.log(`Listning in port ${port}`)
});