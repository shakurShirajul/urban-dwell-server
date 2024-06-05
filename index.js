import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { database } from './database/mongodb.js';
import verifyToken from './middlewares/verifyToken.js';
import jwt from 'jsonwebtoken';

// Schema 
import { Users } from './models/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

database();

//MiddleWares
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true,
}))
app.use(cookieParser());

app.get('/', async (req, res) => {
    res.send("Hello World");
})

// Authentication Related API
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res
        .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true, data: token });

})

app.post('/logout', async (req, res) => {
    const user = req.body;
    console.log('logging out', user);
    res.clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true }).send({ success: true })
})

// Get New User Info And Add To Database
app.get('/users', async (req, res) => {
    const users = await Users.find(req.query);
    res.send(users);
})

app.patch('/users/role', async (req, res) => {
    const { id } = req.query;
    console.log(id);
    const response = await Users.updateOne({ _id: id }, { $set: { user_role: 'user'} })
    res.send(response);
})

app.post('/users', async (req, res) => {
    console.log(req.body);
    const { email: user_email, name: user_name, image: user_image } = req.body;
    const result = await Users.find({ user_email });
    if (result.length === 0) {
        const data = await Users.create({ user_name, user_email, user_image })
        console.log(data);
    }
})

app.get('/users/role', verifyToken, async (req, res) => {
    console.log(req.query.email);

    if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access', u: req.user.email, u1: req.query.email })
    }

    const email = req.query.email;
    const user = await Users.findOne({ user_email: email }, { user_role: 1 });
    console.log(user);
    res.status(200).send(user);
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


