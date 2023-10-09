import express, { Router } from 'express';
const { OpenAI } = require("openai");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose")
const port = 8000;
import serverless from 'serverless-http';
const app = express();
const router = Router();
require("dotenv/config");

const stripe = require("stripe")(process.env.STRITE_kEY);
app.use(bodyParser.json());

// console.log(process.env.API_KEY_DATABASES);

app.use(cors());
const API_KEY = process.env.API_KEY_DATABASES
async function dbConnect() {
  try {
    await mongoose.connect(API_KEY)
    
    console.log("Connected to DataBase")

  }
  catch (e) {
    console.error(e)
  }
  console.log(API_KEY)
}
dbConnect()

const openai = new OpenAI({
  apiKey: process.env.Open_AI
});

const Post = require('./PostModel/Post')
const UserData = require('./PostModel/User');
const { json } = require('body-parser');
router.post("/user" , async(req, res)=>{
  const { userEmail,userName } = req.body;
  const {email}=req.query
  const user=await UserData.findOne({email})
  if(user){
    console.log("User Already Created")
    console.log("existing user",user.email);   
  // console.log(user.token)
  }

 else{  let userData = await UserData.create({
    email:userEmail,
    name:userName,
    token:15
  })
  res.send(userData)
  console.log(userData)}
})
router.post("/post", async (req, res) => {
  const {email}=req.query
    const checktoken=await UserData.findOne({email})
  if(checktoken.token===0){
    console.log("Cerdit is Zero")
  }
  else{
  const { topic, keyWords } = req.body;
  const userEmail = req.headers["authorization"];
  let openAiResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      content: `Write a detailed description about ${topic}. It should be SEO firendly and includes following comma separated keywords ${keyWords}. The response should be in html with title and meta description.
        The response should be following json:.
        {"postContent":post content goes here,"title":title goes here,"metaDescription":meta description goes here} Remeber the response should be a proper json with no space between keys of json`, 
        role: "user"
    }]
  });

  console.log(openAiResponse);
  const result = (openAiResponse.choices[0].message.content)
  console.log(result)
  const finalResult = JSON.parse(result);
  res.send(finalResult);
  let post = await Post.create({
    title: finalResult.title,
    post: finalResult.postContent,
    description: finalResult.metaDescription,
    email:userEmail
  })
  console.log(post)
  if(post){
    const {email}=req.query
    const userCheck=await UserData.findOne({email})
    console.log(userCheck.token)
  //  const umer=userCheck.token-5
   const now = await UserData.updateOne({token:userCheck.token-5})
   console.log(now)
  }
  }
})
// // Define a route to retrieve posts from the database
router.get("/post", async (req, res) => {
  try {
    const {email}= req.query;
    if (!email) {
      // If email is not provided in the query, respond with a bad request status (400).
      return res.status(400).json({ error: "Email parameter is required." });
    }
     let posts=await Post.find({email});
     res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/postdata", async (req, res) => {
  try {
    const posts = await Post.findById('');
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/userdata", async (req, res) => {
  try {
    const {email}= req.query;
    if (!email) {
      // If email is not provided in the query, respond with a bad request status (400).
      return res.status(400).json({ error: "Email parameter is required." });
    }
     let userdatadb=await UserData.findOne({email});
     console.log(userdatadb)
     res.json(userdatadb);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/create-checkout-session",async(req,res)=>{
    const {user} = req.body;
    // const userData = JSON.parse(user)
    console.log(user)
    const lineItems = [
      {
    price_data: {
        currency: "usd", // Replace with the desired currency
        product_data: {
          name: "AI Blog"// Replace with the product name
        },
        unit_amount: 500, // Replace with the price in cents (e.g., $5.00)
      },
      quantity: 1, // Set the quantity as needed
    },
  ];
    

    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        line_items:lineItems,
        mode:"payment",
        success_url:"http://localhost:3000/sucess",
        cancel_url:"http://localhost:3000/cancel",
    });
if(session){
  const {email}=req.query
    const userCheck=await UserData.findOne({email})
    console.log(userCheck.token)
  //  const umer=userCheck.token-5
   const now = await UserData.updateOne({token:userCheck.token+25})
   console.log(now)
}
    res.json({id:session.id})
 
})
app.use('/api/', router);

export const handler = serverless(app);
