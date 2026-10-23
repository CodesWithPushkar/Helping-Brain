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
import { createServer } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Server } from 'socket.io';


const app = express();
const port = Number(process.env.PORT ?? 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) throw new Error('FATAL: FRONTEND_URL environment variable is missing.');

const allowedOrigins = FRONTEND_URL
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) throw new Error('FATAL: FRONTEND_URL must contain at least one origin.');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],              
}));

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const JWT_SECRET = process.env.JWT_SECRET;

if(!GOOGLE_CLIENT_ID) throw new Error('FATAL: GOOGLE_CLIENT_ID environment variable is missing.');
if(!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is missing.');

const client = new OAuth2Client(GOOGLE_CLIENT_ID);


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

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN;

if (!AI_SERVICE_URL) throw new Error('FATAL: AI_SERVICE_URL environment variable is missing.');
if (!AI_SERVICE_TOKEN) throw new Error('FATAL: AI_SERVICE_TOKEN environment variable is missing.');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string") return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof decoded.email !== "string") return next(new Error("Unauthorized"));
    socket.data.email = decoded.email;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("workspace:join", async (
    payload: { workspaceId: number },
    acknowledge?: (response: { success: boolean; error?: string }) => void,
  ) => {
    if (!Number.isInteger(payload?.workspaceId)) {
      acknowledge?.({ success: false, error: "Invalid workspace ID" });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: socket.data.email },
        select: { id: true },
      });
      if (!user) {
        acknowledge?.({ success: false, error: "Unauthorized" });
        return;
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: payload.workspaceId,
          is_deleted: false,
          OR: [
            { owner_id: user.id },
            { members: { some: { user_id: user.id } } },
          ],
        },
        select: { id: true },
      });
      if (!workspace) {
        acknowledge?.({ success: false, error: "Forbidden" });
        return;
      }

      await socket.join(`workspace:${workspace.id}`);
      acknowledge?.({ success: true });
    } catch (error) {
      console.error("Workspace socket join failed:", error);
      acknowledge?.({ success: false, error: "Unable to join workspace" });
    }
  });
});

const workspaceAccessFilter = (userId: number) => ({
  OR: [
    { owner_id: userId },
    { members: { some: { user_id: userId } } },
  ],
});

const matchesAiServiceToken = (candidate: string | undefined) => {
  if (!candidate) return false;
  const expected = Buffer.from(AI_SERVICE_TOKEN);
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

const inviteTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");




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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: result.data.workspaceId,
        is_deleted: false,
        ...workspaceAccessFilter(user.id),
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
          color: result.data.color,
          created_by_id: user.id,
          updated_by_id: user.id,
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
          workspace_id: result.data.workspaceId,
          is_deleted: false,
        }
      })

      if(!parentPage) return res.status(403).json({ error: 'Forbidden' });
      createdPage = await prisma.page.create({
        data: {
          title: result.data.title,
          workspace_id: result.data.workspaceId,
          parent_page_id: parentPage.id,
          icon: result.data.icon,
          color: result.data.color,
          created_by_id: user.id,
          updated_by_id: user.id,
        },
        include: {
          _count: {
            select: { children: true }
          }
        }
      });

    }

    io.to(`workspace:${workspace.id}`).emit("workspace:changed", { workspaceId: workspace.id });

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
        is_deleted: false,
        ...workspaceAccessFilter(user.id),
      },
      include: {
        owner: {
          select: { name: true },
        },
        members: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
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
      workspaces: workspaces.map((workspace) => ({
        ...workspace,
        isOwner: workspace.owner_id === user.id,
      })),
    })
  }catch(error){
    return res.status(401).json({ error: 'Internal server error' });
  }
});

app.post("/api/workspace/:id/invite-link", auth, async (req, res) => {
  const email = req.email;
  const workspaceId = Number(req.params.id);
  if (!email) return res.status(401).json({ error: "Unauthorized" });
  if (!Number.isInteger(workspaceId)) return res.status(400).json({ error: "Invalid workspace ID" });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, owner_id: user.id, is_deleted: false },
      select: { id: true },
    });
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    const token = randomBytes(32).toString("base64url");
    await prisma.workspaceInvite.upsert({
      where: { workspace_id: workspace.id },
      create: {
        workspace_id: workspace.id,
        token_hash: inviteTokenHash(token),
      },
      update: {
        token_hash: inviteTokenHash(token),
        created_at: new Date(),
      },
    });

    const frontendOrigin = allowedOrigins[0];
    return res.status(200).json({
      inviteUrl: new URL(`/join/${token}`, frontendOrigin).toString(),
    });
  } catch (error) {
    console.error("Workspace invite creation failed:", error);
    return res.status(500).json({ error: "Unable to create invite link" });
  }
});

app.delete("/api/workspace/:id/invite-link", auth, async (req, res) => {
  const email = req.email;
  const workspaceId = Number(req.params.id);
  if (!email) return res.status(401).json({ error: "Unauthorized" });
  if (!Number.isInteger(workspaceId)) return res.status(400).json({ error: "Invalid workspace ID" });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, owner_id: user.id, is_deleted: false },
      select: { id: true },
    });
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    await prisma.workspaceInvite.deleteMany({ where: { workspace_id: workspace.id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Workspace invite revocation failed:", error);
    return res.status(500).json({ error: "Unable to revoke invite link" });
  }
});

app.post("/api/workspace/invite/:token", auth, async (req, res) => {
  const email = req.email;
  const token = req.params.token;
  if (!email) return res.status(401).json({ error: "Unauthorized" });
  if (typeof token !== "string" || token.length !== 43) {
    return res.status(404).json({ error: "Invite link is invalid or has been revoked" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token_hash: inviteTokenHash(token) },
      select: { workspace_id: true },
    });
    if (!invite) return res.status(404).json({ error: "Invite link is invalid or has been revoked" });

    const workspace = await prisma.workspace.findFirst({
      where: { id: invite.workspace_id, is_deleted: false },
      select: { id: true, name: true },
    });
    if (!workspace) return res.status(404).json({ error: "Workspace is unavailable" });

    await prisma.workspaceMember.upsert({
      where: {
        workspace_id_user_id: {
          workspace_id: workspace.id,
          user_id: user.id,
        },
      },
      create: {
        workspace_id: workspace.id,
        user_id: user.id,
      },
      update: {},
    });

    return res.status(200).json({ success: true, workspace });
  } catch (error) {
    console.error("Workspace invite join failed:", error);
    return res.status(500).json({ error: "Unable to join workspace" });
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
        is_deleted: false,
        workspace: {
          is_deleted: false,
          ...workspaceAccessFilter(user.id),
        }
       },
      include: {
        created_by: { select: { id: true, name: true } },
        updated_by: { select: { id: true, name: true } },
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

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!workspace || !user || workspace.is_deleted || (
      workspace.owner_id !== user.id &&
      !(await prisma.workspaceMember.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: workspace.id,
            user_id: user.id,
          },
        },
      }))
    )) {
      return res.status(403).json({
        error: "Forbidden"
      });
    }


    const notes = await prisma.page.findMany({
      where: {
        workspace_id: Number(workspaceId),
        is_deleted: false,
        title: {
          contains: q,
          mode: 'insensitive'
        }
      }
    });

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
        is_deleted: false,
        workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) },
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
      where: {
        id: page_id,
        workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) },
      },
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
      where: {
        id,
        page: { workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) } },
      },
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
  if (!matchesAiServiceToken(req.header("x-ai-service-token"))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
          is_deleted: false,
          ...workspaceAccessFilter(userId),
        },
        is_deleted: false,
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
        workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) },
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
        summary: null,
        last_summary_count: 0,
        history: [],

      }, {
        headers: { "x-ai-service-token": AI_SERVICE_TOKEN },
      });

      aiText = llmRes.data.answer;
    } catch (aiError) {
      console.error(
        "AI service error:",
        aiError instanceof Error ? aiError.message : "Unknown error",
      );
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
        page: { workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) } },
      },
      include: {
        messages: { orderBy: { id: "asc" } },
        page: { select: { workspace_id: true } },
      },
    });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const unsummarized = chat.messages.filter((m) => {
      return chat.messages.indexOf(m) >= chat.last_summary_count;
    });



    const userMessage = await prisma.chatMessage.create({
      data: {
        role: "user",
        content: message,
        chat_id: chat.id,
      },
    });

    const history = unsummarized.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messageCountSinceSummary = unsummarized.length + 1;

    let aiText: string;
    try {
      const llmRes = await axios.post(`${AI_SERVICE_URL}/chat`, {
        userId: user.id,
        workspaceId: chat.page.workspace_id,
        pageId: page_id,
        message,
        history,
        summary: chat.summary || null,
        last_summary_count: messageCountSinceSummary || 0
      }, {
        headers: { "x-ai-service-token": AI_SERVICE_TOKEN },
      });

      aiText = llmRes.data.answer;

      if(llmRes.data.summaryCreated){
        const newLastSummaryCount = chat.last_summary_count + messageCountSinceSummary;
        await prisma.chat.update({
          where: {
            id,
          },
          data:{
            summary: llmRes.data.summary,
            last_summary_count: newLastSummaryCount
        }
      })}
      


    } catch (aiError) {
      if (axios.isAxiosError(aiError)){
        if (aiError.response?.data?.detail){
          console.error("FastAPI Validation Error:", JSON.stringify(aiError.response.data.detail, null, 2));
        } else {
          console.error("AI service HTTP error:", aiError.message);
        }
      } else {
        console.error(
          "Unknown AI service error:",
          aiError instanceof Error ? aiError.message : "Unknown error",
        );
      }
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
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const page = await prisma.page.findFirst({
      where: {
        id: Number(req.params.id),
        is_deleted: false,
        workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) },
      },
      select: { id: true, workspace_id: true },
    });
    if (!page) return res.status(404).json({ error: "Page not found" });

    const updated = await prisma.page.update({
      where: { id: page.id },
      data: {
        ...(result.data.title !== undefined && { title: result.data.title }),
        ...(result.data.content !== undefined && { content: result.data.content }),
        updated_by_id: user.id,
      },
      include: {
        updated_by: { select: { id: true, name: true } },
      },
    });

    io.to(`workspace:${page.workspace_id}`).emit("page:updated", {
      pageId: updated.id,
      title: updated.title,
      content: updated.content,
      updatedAt: updated.updated_at,
      updatedBy: updated.updated_by,
    });
    io.to(`workspace:${page.workspace_id}`).emit("workspace:changed", {
      workspaceId: page.workspace_id,
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
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const update = await prisma.workspace.update({
      where: {
        id,
        owner_id: user.id,
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
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const page = await prisma.page.findFirst({
      where: {
        id,
        is_deleted: false,
        workspace: { is_deleted: false, ...workspaceAccessFilter(user.id) },
      },
      select: { id: true, workspace_id: true },
    });
    if (!page) return res.status(404).json({ error: "Page not found" });

    const update = await prisma.page.update({
      where: { id: page.id },
      data: {
        is_deleted: true,
        updated_by_id: user.id,
      }
    })

    io.to(`workspace:${page.workspace_id}`).emit("page:deleted", { pageId: page.id });
    io.to(`workspace:${page.workspace_id}`).emit("workspace:changed", {
      workspaceId: page.workspace_id,
    });

    res.status(200).json({
      update
    })
    
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});




httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});