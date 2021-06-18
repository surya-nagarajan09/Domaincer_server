// requiring express
const express=require('express');
const app=express();
app.use(express.json());

require("dotenv").config();

const cors=require("cors");
app.use(cors());

const bcrypt=require("bcrypt");

// mongodb

const mongodb=require("mongodb");
const mongoClient=mongodb.MongoClient;
const objectId=mongodb.ObjectId;

/** jwt */

const JWT=require("jsonwebtoken");
const jwt_secret=process.env.JWT_SECRET;


const db_url=process.env.DB_URL || "mongodb://127.0.0.1:27017/";
const port=process.env.port || 4000;

app.get("/all",async(req, res)=>{
    const client= await mongoClient.connect(db_url);
    const db= client.db("jobseeker")
    const data =await db.collection("user").find().toArray();
    res.status(200).json(data)
    client.close();
})

app.post("/register-jobseeker",async(req,res)=>{
    const client= await mongoClient.connect(db_url);

    if(client){
        try{
        const db=client.db("jobseeker");
        let userData={
            fname:req.body.fname,
            lname:req.body.lname,
            email:req.body.email,
            pwd:req.body.pwd
        }

        const finduser = await db.collection("user").findOne({email:userData.email})
        
        if(finduser){
            res.status(400).json({message:"user already exist"})
        }else{
            let salt = await bcrypt.genSalt(10);
            let hashedPassWord= await bcrypt.hash(userData.pwd,salt);
            console.log(hashedPassWord)
            userData.pwd=hashedPassWord;
            let insertData= await db.collection("user").insertOne(userData);
            if(insertData){
                res.status(200).json({message:"userCreated successfully"})
                client.close()
            }
        }
    }catch(e){
        console.log(e)
    }
    }else{
        res.status(500).json({message:'internal server error'});
        client.close();
    }
});


app.post("/login-seeker",async(req,res)=>{
    const client= await mongoClient.connect(db_url);
    if(client){
        let userData={
            email:req.body.email,
            pwd:req.body.pwd
        }
        try{
            const db=client.db("jobseeker");
            const find= await db.collection("user").findOne({email:userData.email});
            if(find){
                const compare = await bcrypt.compare(userData.pwd,find.pwd)
                if(compare){
                    const token = JWT.sign(userData.email,jwt_secret);
                    console.log(token)
                    res.status(200).json(token)

                }else{
                    res.status(400).json({message:"password not match"})
                }

            }else{
                res.status(404).json({message:"user not found"})
        
            }

        }catch(err){
            console.log(err)
        }

    }else{
        res.status(500).json({message:"internal server error"})
    }
})
app.listen(port,()=>console.log(`app runs with ${port}`))