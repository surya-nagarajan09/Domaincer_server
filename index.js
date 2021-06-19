// requiring express
const express=require('express');
const app=express();
app.use(express.json());
const {v4 : uuidv4} = require('uuid')

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
const { response } = require('express');
const jwt_secret=process.env.JWT_SECRET;


const db_url=process.env.DB_URL || "mongodb://127.0.0.1:27017/";
const port=process.env.PORT || 4000;

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
            const userDetails={
                name:find.fname,
                email:find.email
            }
            console.log(userDetails)
            if(find){
                const compare = await bcrypt.compare(userData.pwd,find.pwd)
                if(compare){
                    const token = JWT.sign(userData.email,jwt_secret);
                    console.log(token)
                    res.status(200).json({token,userDetails})

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
});

// recruiter signup
app.post("/register-company",async(req,res)=>{
    const client= await mongoClient.connect(db_url);

    if(client){
        try{
        const db=client.db("jobseeker");
        let userData={
            name:req.body.name,
            number:req.body.number,
            email:req.body.email,
            pwd:req.body.pwd,
            company:req.body.cname,
        }

        const finduser = await db.collection("recruiter").findOne({email:userData.email})
        
        if(finduser){
            res.status(400).json({message:"recruiter already exist"})
        }else{
            let salt = await bcrypt.genSalt(10);
            let hashedPassWord= await bcrypt.hash(userData.pwd,salt);
            userData.pwd=hashedPassWord;
            let insertData= await db.collection("recruiter").insertOne(userData);
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
// login recruiter

app.post("/login-recruiter",async(req,res)=>{
    const client= await mongoClient.connect(db_url);
    if(client){
        let userData={
            email:req.body.email,
            pwd:req.body.pwd   
        }
        try{
            const db=client.db("jobseeker");
            const find= await db.collection("recruiter").findOne({email:userData.email});
            const recruiterDetails={
                email:find.email,
                cname:find.cname
            }
            if(find){
                const compare = await bcrypt.compare(userData.pwd,find.pwd)
                if(compare){
                    const token = JWT.sign(userData.email,jwt_secret);
                    res.status(200).json({token,recruiterDetails})

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
});


// create job
app.post("/create_job",async(req,res)=>{
    const client= await mongoClient.connect(db_url);
    if(client){
        try{
            let access_token=req.headers.authorization;
            let verify= await JWT.verify(access_token,jwt_secret);
            const newId = uuidv4()
            const userData={
               id:newId,
               jname:req.body.jname,
               jobDes:req.body.jobDes,
               skills:req.body.skills,
               ctc:req.body.ctc,
               noticeperiod:req.body.noticePeriod,
               location:req.body.location,
               experience:req.body.experience,
               education:req.body.education,
               role:req.body.role,
               applicants:[],
               postedBy:req.body.postedBy
            }
            
            if(verify){
                const db = client.db("jobseeker");
                const data = await db.collection("jobs").insertOne(userData);
    
                if(data){
                    res.status(200).json({message:"job created successfully"})
                }

            }else{
                res.status(401).json({message:"token invalid" })
            }
          
           
        }catch(err){
            console.log(err)
        }
        
    }else{
        res.status(500).json({message:"internal Server Error"})
    }
})

// get all job

app.get("/jobs",async(req,res)=>{
    const client= await mongoClient.connect(db_url);

    if(client){
        try{
            const db =client.db("jobseeker");
            const data =await db.collection("jobs").find().toArray();
            res.status(200).json(data);
            
        }catch(err){
            console.log(err)
        }

    }else{
        res.status(500).json({message:"internal Server Error"})
    }
})

/** apply for a job */

app.post("/apply_jobs",async(req,res)=>{
    const client= await mongoClient.connect(db_url);
    if(client){
        const jobData={
            id:req.body.id
        }
        const applier=[{
            email:req.body.email,
            name:req.body.name
        }]
        try{
            let access_token=req.headers.authorization;
            let verify= await JWT.verify(access_token,jwt_secret);
            if(verify){
            const db =client.db("jobseeker");
            const job_find= await db.collection("jobs").updateOne({id:jobData.id},{$push:{applicants:applier}});
            res.status(200).json({message:"success"});  
            }else{
                res.status(401).json({message:"token invalid"})
            }
          }catch(e){
            console.log(e)
        }
       


    }else{
        res.status(500).json({message:"internal Server Error"})
    }

});

app.get("/get_applicants/:email",async(req,res)=>{
    const client= await mongoClient.connect(db_url);
    if(client){
            
        try{
                const db=client.db("jobseeker");
                const data= await db.collection("jobs").find({postedBy:req.params.email}).toArray();
                res.status(200).json(data);
                client.close();

        }catch(err){
            console.log(err)
        }

    }else{
        res.status(500).json({message:"internal Server Error"})
    }
})



app.listen(port,()=>console.log(`app runs with ${port}`))