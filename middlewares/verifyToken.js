import jwt from 'jsonwebtoken'

const verifyToken = async (req, res, next) => {

    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    const token = req.headers.authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

export default verifyToken;