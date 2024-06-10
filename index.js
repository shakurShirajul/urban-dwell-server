import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { database } from './database/mongodb.js';
import verifyToken from './middlewares/verifyToken.js';
import verifyAdmin from './middlewares/verifyAdmin.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// Schema 
import { Users } from './models/users.js';
import { Announcements } from './models/announcements.js';
import { Apartments } from './models/apartments.js';
import { Agreement } from './models/agrements.js';
import { Coupons } from './models/coupons.js';
import { Payments } from './models/payments.js';
import { ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;

database();

//MiddleWares
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://urbandwell.netlify.app/aparments'
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
    res.send({ token })
})

app.post('/logout', async (req, res) => {
    const user = req.body;
    console.log('logging out', user);
    res.clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true }).send({ success: true })
})

//////////////////////////////////////////////////

app.get('/users/specific/:email', async (req, res) => {

    const email = req.params.email;
    const user = await Users.findOne({ user_email: email });

    const userAgreement = await Agreement.findOne({ user_email: email });

    const userDataAgreementInfo = {
        user_name: user.user_name,
        user_email: user.user_email,
        user_image: user.user_image,
        block_name: userAgreement?.block_name ? userAgreement?.block_name : 'None',
        floor_no: userAgreement?.floor_no ? userAgreement.floor_no : "None",
        apartment_no: userAgreement?.apartment_no ? userAgreement.apartment_no : "None",
        agreement_accept_date: userAgreement?.agreement_accept_date ? userAgreement.agreement_accept_date : "None",
        rent: userAgreement?.rent,
    }
    res.send(userDataAgreementInfo);

})

app.get('/admin/info', verifyToken, verifyAdmin, async (req, res) => {
    const adminData = await Users.findOne({ user_email: req.query.email, user_role: 'admin' });
    res.status(200).send(adminData)
})

// Getting Stats For Admin Profile

app.get('/admin/stats', verifyToken, verifyAdmin, async (req, res) => {

    const apartments = await Apartments.find({});
    const users = await Users.find({ user_role: "user" });
    const members = await Users.find({ user_role: "member" });

    const percentageOfAvailableRoom = (((apartments.length - members.length) / apartments.length) * 100).toFixed(2);
    const percentageOfUnavailableRoom = (((members.length) / apartments.length) * 100).toFixed(2);

    const stats = {
        totalApartments: apartments.length,
        totalUsers: users.length,
        totalMembers: members.length,
        percentageOfAvailableRoom,
        percentageOfUnavailableRoom
    }
    res.status(200).send(stats);
});


/////////////////////////////////////////////////


// Create New User When SignUp 
app.post('/users', async (req, res) => {
    const { email: user_email, name: user_name, image: user_image } = req.body;
    const result = await Users.find({ user_email });
    if (result.length === 0) {
        const data = await Users.create({ user_name, user_email, user_image })
    }
})

app.get('/users/role', verifyToken, async (req, res) => {
    if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access', u: req.user.email, u1: req.query.email })
    }
    const email = req.query.email;
    const user = await Users.findOne({ user_email: email }, { user_role: 1 });
    res.status(200).send(user);
})

// Announcement Routes Are Here
app.get('/announcements', verifyToken, async (req, res) => {
    if (req.user.email !== req.query.email) {
        console.log(req.user.email, " ", req.query.email)
        return res.status(403).send({ message: 'forbidden access', u: req.user.email, u1: req.query.email })
    }
    const data = await Announcements.find({}).sort({ announce_date: -1 });
    res.status(200).send(data);
})

// Apartments
app.get('/apartments', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const apartments = await Apartments.find({})
        .skip(page * limit)
        .limit(limit);
    res.send(apartments);
})

app.get('/appartment/length', async (req, res) => {
    const apartments = await Apartments.find({});
    res.send(apartments);
})

// Agrement Route to disbale Agreement Button 
app.get('/agreement', verifyToken, async (req, res) => {
    if (req.user.email !== req.query.email) {
        console.log("here");
        console.log(req.user.email, " ", req.query.email)
        return res.status(403).send({ message: 'forbidden access', u: req.user.email, u1: req.query.email })
    }
    const data = await Agreement.find({ user_email: req.query.email });
    res.send(data);
})

app.post('/agreement', verifyToken, async (req, res) => {
    if (req.user.email !== req.query.email) {
        console.log("here");
        console.log(req.user.email, " ", req.query.email)
        return res.status(403).send({ message: 'forbidden access', u: req.user.email, u1: req.query.email })
    }
    const response = await Agreement.create(req.body)
    console.log(response);
    res.status(200).send(response);
})


/* ~~~~~~~~ All Admin Routes Start ~~~~~~~~ */

// Agreement Request That Show On Admin Panel Agreement Request

app.get('/agreements/requests', verifyToken, verifyAdmin, async (req, res) => {
    const data = await Agreement.find({ status: "pending" });
    res.send(data);
})

app.patch('/agreements/requests/updates', verifyToken, verifyAdmin, async (req, res) => {
    const { status, id } = req.query;
    if (status === 'accepted') {
        const agreementResponse = await Agreement.updateOne({ _id: id }, { $set: { status: 'checked', agreement_accept_date: Date.now() } })
        const data = await Agreement.find({ _id: id })
        const usersResponse = await Users.updateOne({ user_email: data[0].user_email }, { $set: { user_role: 'member' } })
        res.status(200).send(usersResponse);
    }
    else if (status === 'rejected') {
        const agreementResponse = await Agreement.updateOne({ _id: id }, { $set: { status: 'checked' } })
        res.status(200).send(agreementResponse);
    }

})

app.post('/announcement', verifyToken, verifyAdmin, async (req, res) => {
    const response = await Announcements.create(req.body)
    res.send(response);
})

// Remove member role frome
app.patch('/users/role', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.body;

    const data = await Users.findOne({ _id: id });
    const response = await Users.updateOne({ _id: id }, { $set: { user_role: 'user' } })
    const deleteAgreement = await Agreement.deleteOne({ user_email: data.user_email })

    res.send(response);
})

// Get New User Info And Add To Database
app.get('/users/members', verifyToken, verifyAdmin, async (req, res) => {
    const users = await Users.find({ user_role: "member" });
    res.send(users);
})

// Make Coupon in stripe and store in database

app.post('/create-coupon', async (req, res) => {

    const { couponCode, couponDiscount, couponDescription } = req.body;
    console.log("Coupon Is Here")
    try {
        const coupon = await stripe.coupons.create({
            id: couponCode,
            percent_off: couponDiscount,
            duration: 'repeating',
            duration_in_months: 4,
        });
        const couponData = await Coupons.create({
            coupon_Code: couponCode,
            coupon_Discount: couponDiscount,
            coupon_Description: couponDescription
        })
        console.log(couponData)
        res.status(200).json({ coupon });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: error.message });
    }
});


app.delete('/delete-coupon/:couponId', async (req, res) => {
    try {
        const couponId = req.params.couponId;

        if (!couponId) {
            return res.status(400).json({ error: 'Coupon ID is required' });
        }

        await stripe.coupons.del(couponId);

        const deleteRepsonse = await Coupons.deleteOne({ coupon_Code: couponId })

        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/create-payment-intern', async (req, res) => {
    const { amount, coupon } = req.body;
    try {
        let finalAmount = amount * 100;
        let discountAmount = 0;
        if (coupon) {
            const couponDetails = await stripe.coupons.retrieve(coupon);
            if (couponDetails.valid) {
                if (couponDetails.percent_off) {
                    discountAmount = (amount * (couponDetails.percent_off / 100));
                    finalAmount -= (finalAmount * (couponDetails.percent_off / 100));
                } else if (couponDetails.amount_off) {
                    finalAmount -= couponDetails.amount_off;
                }
            } else {
                return res.status(400).json({ error: 'Invalid coupon' });
            }
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalAmount),
            currency: 'usd',
        });

        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
            discountAmount
        });
    } catch (error) {
        res.status(400).send({
            error: {
                message: error.message,
            },
        });
    }
})

app.post('/apartment-rent-info', async (req, res) => {
    console.log(req.body);
    const response = await Payments.create(req.body);
    res.status(200).send(response)

})

app.get('/apartment-rent-info', async (req, res) => {
    const response = await Payments.find({ email: req.query.email });
    res.send(response);
})
app.get('/apartment-rent-info/search', async (req, res) => {
    const response = await Payments.find({ email: req.query.email, month: req.query.month });
    res.send(response);
})

/* ~~~~~~~~ All Admin Routes End ~~~~~~~~ */


/* ~~~~~~~~ Checking Adming or Member Or Imposter ~~~~~~~~ */

app.get('/users/checking', verifyToken, async (req, res) => {
    if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' })
    }
    const query = { user_email: req.query.email };
    const user = await Users.find(query);
    let validation = false;
    if (user) {
        validation = user[0]?.user_role === req.query.role;
    }
    res.send({ validation });
})

/* ~~~~~~~~ Checking Adming Or Not ~~~~~~~~ */


/* ```````` Coupon ```````````` */
app.get('/coupon-code', async (req, res) => {
    const couponCode = await Coupons.find({});
    res.send(couponCode);
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


