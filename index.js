const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.h49xnox.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(401).send({ message: "Unauthorized access" })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('daduvai').collection('services')

        const orderCollection = client.db('daduvai').collection('orders');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray(query);
            res.send(services)
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)

        })

        //orders api

        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('inside orders api', decoded);
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: "unauthorized access" })
            }
            // console.log(req.headers.authorization)
            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

    }
    finally {

    }

}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Dadu vai is running')
})

app.listen(port, () => {
    console.log(`Dadu vai is running on ${port}`)
})