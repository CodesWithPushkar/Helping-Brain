import express, {type Request} from 'express'
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import path from 'path';
import 'dotenv/config';
import cors from 'cors';
import { fileURLToPath } from 'url'
import { prisma } from './prismaClient.js';
import jwt from 'jsonwebtoken'


const app = express();
const port = 3000;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
// app.use(express.static(path.join(__dirname, '../public')));

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const JWT_SECRET = process.env.JWT_SECRET!; 

if(!GOOGLE_CLIENT_ID) throw new Error('FATAL: GOOGLE_CLIENT_ID environment variable is missing.');

const client = new OAuth2Client('GOOGLE_CLIENT_ID');



app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try{

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    })

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




app.listen(port, () => {
  console.log(`Listning in port ${port}`)
})