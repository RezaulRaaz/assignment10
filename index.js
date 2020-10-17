const express = require('express')
const bodyParser = require('body-parser');
const fileUpload =require('express-fileupload')
const fs = require('fs-extra')
const cors =require('cors')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');
require('dotenv').config();

const port =5000


const app = express()
app.use(express.static('icons'));
app.use(fileUpload())
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./agency-8ce53-firebase-adminsdk-f4cf3-88ff8e026f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://agency-8ce53.firebaseio.com"
});
 
// admin.auth().verifyIdToken(idToken)
//   .then(function(decodedToken) {
//     let uid = decodedToken.uid;
//     // ...
//   }).catch(function(error) {
//     // Handle error
//   });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dtt4b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db(process.env.DB_NAME).collection("servicess");
  const reviewCollection = client.db(process.env.DB_NAME).collection("reviews");
  const enrolledServiceCollection = client.db(process.env.DB_NAME).collection("enrolledServices");
  const adminCollection = client.db(process.env.DB_NAME).collection("adminCollection");
  console.log('db connected successfully')

  app.get('/',(req,res)=>{
    if(req.headers.authorization){
      admin.auth().verifyIdToken(req.headers.authorization)
      .then(result=>{
          res.send(result)
      })
    }else{
      res.send('Hello World!')
    }
    
})

  app.post('/addAService',(req, res) =>{
    const file =req.files.image;
    const title =req.body.title;
    const description =req.body.description;
    const filePath = `${__dirname}/icons/${file.name}`;
    const newIcon = file.data;
    const encIcon = newIcon.toString('base64');
    file.mv(filePath,err =>{
      if(err => {
        res.status(500).send({msg:'Failed to Upload'})
      })
      var Icon = {
        contentType:file.mimetype,
        size:file.size,
        img:Buffer.from(encIcon,'base64')
      };
      servicesCollection.insertOne({
        title:title,
        description:description,
        icon:Icon
      })
      .then(result=>{
        fs.remove(filePath,error=>{
          if(error){ 
            res.status(500).send({msg:'Failed to Upload'})
          }
          res.send(result.insertedCount > 0)
        })
      })
      // return res.send({name:file.name})
    })
  })

  app.get('/allService', (req, res)=>{
    servicesCollection.find({})
    .toArray((err,documents)=>{
      res.send(documents)
    })
  })

  app.delete('/deleteService/:id', (req, res)=>{
    servicesCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then((result) =>{
      res.send(result.insertedCount > 1)
    })
  })

  app.post('/addReview',(req, res) =>{
    const file =req.files.image;
    const name =req.body.name;
    const designation =req.body.designation;
    const description =req.body.description;
    const filePath = `${__dirname}/avatar/${file.name}`;
    const newIcon = file.data;
    const encIcon = newIcon.toString('base64');
    file.mv(filePath,err =>{
      if(err => {
        res.status(500).send({msg:'Failed to Upload'})
      })
      var avatar = {
        contentType:file.mimetype,
        size:file.size,
        img:Buffer.from(encIcon,'base64')
      };
      reviewCollection.insertOne({
        name:name,
        description:description,
        designation:designation,
        image:avatar
      })
      .then(result=>{
        fs.remove(filePath,error=>{
          if(error){ 
            res.status(500).send({msg:'Failed to Upload'})
          }
          res.send(result.insertedCount > 0)
        })
      })
      // return res.send({name:file.name})
    })
  })



  app.get('/allReview', (req, res)=>{
    reviewCollection.find({})
    .toArray((err,documents)=>{
      res.send(documents)
    })
  })

  app.delete('/deleteReview/:id', (req, res)=>{
    reviewCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then((result) =>{
      res.send(result.insertedCount > 1)
    })
  })


  app.post('/addServiceErolled',(req, res) =>{
    const file =req.files.image;
    const name =req.body.name;
    const email =req.body.email;
    const title =req.body.title;
    const price =req.body.price;
    const status =req.body.status;
    const description =req.body.description;
    const filePath = `${__dirname}/screenshot/${file.name}`;
    const newImage = file.data;
    const encImage = newImage.toString('base64');
    file.mv(filePath,err =>{
      if(err => {
        res.status(500).send({msg:'Failed to Upload'})
      })
      var avatar = {
        contentType:file.mimetype,
        size:file.size,
        img:Buffer.from(encImage,'base64')
      };
      enrolledServiceCollection.insertOne({
        name:name,
        email:email,
        description:description,
        title:title,
        price:price,
        status:status,
        image:avatar
      })
      .then(result=>{
        fs.remove(filePath,error=>{
          if(error){ 
            res.status(500).send({msg:'Failed to Upload'})
          }
          res.send(result.insertedCount > 0)
        })
      })
      // return res.send({name:file.name})
    })
  })

  app.get('/allEnrolledServices', (req, res)=>{
    admin.auth().verifyIdToken(req.headers.authorization)
    .then(result=>{
      enrolledServiceCollection.find({email: result.email})
      .toArray((err,documents)=>{
        res.send(documents)
      })
    })
  })

  app.post('/addAdmin',(req, res) =>{
    adminCollection.insertOne({
       email:req.body.email,
    })
      .then(result=>{
          res.send(result)
      })
  })

  app.post('/admin', (req, res)=>{
    adminCollection.find({email:req.body.email})
    .toArray((err,documents)=>{
      res.send(documents.length > 0)
    })
  })

});

app.listen( process.env.PORT || port)