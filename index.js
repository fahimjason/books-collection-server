const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const admin = require("firebase-admin");
require('dotenv').config();


const port = process.env.PORT || 5500;

const app = express();
app.use(cors());
app.use(bodyParser.json());


// Authorization
var serviceAccount = require("./config/books-collection-fahim-firebase-adminsdk-o4zg3-6e86c126ac.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4i8kb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const booksCollection = client.db("booksCollection").collection("books");
    const ordersCollection = client.db("booksCollection").collection("orders");


    // Add Books
    app.post('/addBooks', (req, res) => {
        const book = req.body;
        booksCollection.insertOne(book)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    // Show Books
    app.get('/books', (req, res) => {
        booksCollection.find()
            .toArray((err, books) => {
                res.send(books)
            })
    })


    // Single Book Checkout
    app.get('/book/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        booksCollection.find({ _id: id })
            .toArray((err, book) => {
                res.send(book[0])
            })
    })


    // Add order
    app.post('/addOrders', (req, res) => {
        const order = req.body;
        ordersCollection.insertOne(order)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    // Ordered Books 
    app.get('/orderedBooks', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    console.log(tokenEmail, queryEmail);
                    if (tokenEmail === queryEmail) {
                        ordersCollection.find({ email: queryEmail })
                            .toArray((err, orders) => {
                                res.status(200).send(orders)
                                console.log(err)
                            })
                    }
                    else {
                        res.status(401).send('Un-authorized');
                    }
                })
                .catch((error) => {
                    res.status(401).send('Un-authorized');
                });
        }
        else {
            res.status(401).send('Un-authorized');
        }
    })


    // Delete Books
    app.delete('/deleteBooks/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        booksCollection.findOneAndDelete({ _id: id })
            .then(result => {
                res.send(result.deleteCount > 0)
            })
    })
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})