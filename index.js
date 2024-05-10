const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// midlewere
app.use(cors({
  // origin: ['http://localhost:5173'],
  origin: [
    'http://localhost:5173',
    'https://car-doctor-client-6eb60.web.app',
    'https://car-doctor-client-6eb60.firebaseapp.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sf3cbqp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// nijeder mildewere
const logger = async(req, res, next) => {
  console.log('called:', req.host, req.originalUrl);
  next()
}


const varifyToken = async(req,res,next) => {
  const token = req.cookies?.token;
  console.log('value of token in middlewere',token);
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // error
    if(err){
      console.log(err);
      return res.status(401).send({massage: 'unauthorizid'})
    }
    // if token is valid then it would be decoded
    console.log('value in the token:', decoded);
    req.user = decoded;
    next()
  })
}


const cokeOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV == "production" ? "none" : "strict",
  secure: process.env.NODE_ENV == "production" ? true : false,
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
 
    const serviceCollaction = client.db('carDoctor').collection('services');
    const bookingCollaction = client.db('carDoctor').collection('bookings');

    // auth related api
    app.post('/jwt',logger, async(req,res) => {
      const user = req.body;
      console.log('user for token',user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, cokeOption).send({success: true})
    })

    // cokes clear--logout
    app.post('/logout', async(req,res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', {...cokeOption, maxAge: 0}).send({success: true})
    })


    // service ralated api
    app.get('/services',logger, async(req,res) => {
        const cursor = serviceCollaction.find();
        const result = await cursor.toArray();
        res.send(result)
    })

    app.get('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id) };
      const options = {
        // Sort matched documents in descending order by rating
        // sort: { "imdb.rating": -1 },
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1,price:1, service_id: 1, img: 1 },
      };
      const result = await serviceCollaction.findOne(query,options);
      res.send(result)
    })

    // bookings

    app.get('/bookings',logger,varifyToken, async(req,res) => {
      console.log(req.query.email);
      // console.log('tok tok token', req.cookies.token);
      console.log('token wener info',req.user);
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden acces'})
      }
      let query = {};
      if(req.query?.email){
        query = { email: req.query.email }
      };
      const result = await bookingCollaction.find(query).toArray();
      res.send(result);
    })

   app.post('/bookings', async(req, res) => {
    const booking = req.body;
    console.log(booking);
    const result = await bookingCollaction.insertOne(booking);
    res.send(result)
   })

   app.patch('/bookings/:id', async(req,res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updatedBooking = req.body;
    console.log(updatedBooking);
    const updateDoc  = {
      $set: {
        status: updatedBooking.status
      },
    };
    const result = await bookingCollaction.updateOne(filter, updateDoc);
    res.send(result)
   })

   app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await bookingCollaction.deleteOne(query);
    res.send(result)
   })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=> {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is Running on port ${port}`)
})