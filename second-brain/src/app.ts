import express, {type NextFunction, type Request, type Response} from 'express'
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import path from 'path';
import 'dotenv/config';
import cors from 'cors';
import { fileURLToPath } from 'url'
import { prisma } from './prismaClient.js';
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { z } from 'zod';


const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors({
  origin: 'http://localhost:5173',
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

// was folderSchema — a Page now covers both the old Folder and Note concepts
const pageSchema = z.object({
  title: z.string().min(1, { message: "Title is required and cannot be empty" }),
  workspaceId: z.coerce.number().int(),
  parentPageId: z.coerce.number().int().nullable(),
  icon: z.string(),
  color: z.string()
});




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

    console.log(jwtToken)

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

    await prisma.workspace.create({
      data: {
        name: result.data.name,
        owner_id: user?.id
      }
    })

    return res.status(200).json({ message: "Created Successfully" });
  
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
        owner_id: user.id
      },
      include: {
        pages: {
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

app.listen(port, () => {
  console.log(`Listning in port ${port}`)
})