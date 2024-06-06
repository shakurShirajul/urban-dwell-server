import { Users } from "../models/users.js";

const verifyAdmin = async (req, res, next) => {

    const email = req.user.email;
    const query = { user_email: email };
    const user = await Users.find(query);
    const isAdmin = user[0]?.user_role === 'admin';
    if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();

}

export default verifyAdmin;