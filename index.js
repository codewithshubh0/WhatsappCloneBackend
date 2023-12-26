const express  = require("express");
const app = express();
require("dotenv").config();
const cors =require("cors");
const port = process.env.port || 8000;
const {users,Convo, messagemodel,imagemodel} = require("./database")
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));
const bcrypt = require("bcrypt");
const { log } = require("console");
const server = require("http").createServer(app);
const multer = require("multer");
const { set } = require("mongoose");
const io = require("socket.io")().listen(server,{cors :{origin:"*"}})
// image upload
const storage = multer.memoryStorage();

const upload = multer({storage:storage});
 
io.on('connection', (socket) => {
    io.emit("welcome","hello bhai"+socket.id );
   
    socket.on("join",(data)=>{
        socket.join(data.room);
        console.log("user= "+data.user + ", room= "+data.room );
       socket.broadcast.to(data.room).emit("new user joined" , {user:data.user,message:"user joined"})
    })

    socket.on("message",(data)=>{
        socket.join(data.room);
        console.log("user= "+data.user + ", room= "+data.room );
       io.in(data.room).emit("new message" , {user:data.user,message:data.message})
    })
    
});

app.post("/users/saveusers", async(req,res)=>{ 
const {email, name , password} = req.body;
    
    try{
        const checkusers =await users.find({
            email : {$in :[email]}
        })
        console.log(checkusers);
      if(checkusers[0]==null){ 

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newuser = new users({email,name,password:passwordHash})
        const result =await newuser.save();
        res.status(200).json("1") 
       }
       
    }catch(err){
       res.status(400).json(err);
    }
})

app.post("/users/checkuser", async(req,res)=>{ 
    const {email,password} = req.body;
    
    
    try{
    
    const user = await users.findOne({email:email})
    if(!user){
        res.status(200).json("User Not Found")
    }else{
        const validpassword = await bcrypt.compare(password , user.password);
        if(!validpassword){
            res.status(200).json("wrong password")
        }else{

            res.status(200).json(user)
            
        }     
    } 
}catch(err){
       res.status(400).json(err);
    }
})

app.get("/users/getUserToAdd/:username", async(req,res)=>{ 
    try{
    const user = await users.findOne({name:req.params.username})
    if(!user){
        res.status(200).json("-1")
    }else{
        console.log(user);
         res.status(200).json(user)  
    }     
}catch(err){
       res.status(400).json(err);
    }
})

// app.get("/users/getUserId/:username", async(req,res)=>{ 
//     try{
//     const user = await users.findOne({name:req.params.username})
//     if(!user){
//         res.status(200).json("-1")
//     }else{
//         console.log(user);
//          res.status(200).json(user)  
//     }     
// }catch(err){
//        res.status(400).json(err);
//     }
// })

app.get("/users/:UserId",async (req,res)=>{
     
    var friends = {}
    try{
        const conversation =await Convo.find({
            users : {$in: [req.params.UserId ]}
        });
        
        if(conversation!=[]){
           
             for(let convId of conversation){
                
                const user1 = convId.users[0];
                const user2 = convId.users[1];

            //     if(user1==null){
            //         console.log("user1");
            //     }
            //     if(user2==null){
            //          console.log(user");
            //    }
                if(user1!=req.params.UserId){
                    const user = await users.findOne({_id:user1})
                    if(user==null){
                        console.log("null user1"+user1);
                     }
                  friends[user.name] = convId._id;
                }else{

                 const user = await users.findOne({_id:user2})
                 if(user==null){
                    console.log("null user2"+user2);
                 }
                  friends[user.name] = convId._id;
                }
                console.log(friends);
             }
            // console.log(friends);
             res.status(200).json(friends); 
        }else{
            res.status(200).json([]); 
        }
        
    }catch(err){
       res.status(400).json(err);
    }
})


// app.get("/users/:UserId",async (req,res)=>{
     
//     var friends = {}
//     try{
//         const conversation =await Convo.find({
//             users : {$in: [req.params.UserId ]}
//         });
        
//         if(conversation[0]!=null){
         
//              for(let convId of conversation){
//                 var ar = []
//                 const user1 = convId.users[0];
//                 const user2 = convId.users[1];
//                 if(user1!=req.params.UserId){
//                     const user = await users.findOne({_id:user1})
//                  // friends[user.name] = convId._id;
                 
//                   friends[user.name] = [convId._id,user1]
//                 }else{

//                  const user = await users.findOne({_id:user2})
                  
//                   //friends[user.name] = convId._id;
//                   friends[user.name] = [convId._id,user2]
//                 }
//              }
//              //console.log(friends);
//              res.status(200).json(friends); 
//         }else{
//             res.status(200).json([]); 
//         }
        
//     }catch(err){
//        res.status(400).json(err);
//     }
// })


app.post("/converations/storeconversations",async(req,res)=>{
     
    console.log("coming convo");

    const conv =await Convo.findOne({
        users: {$all:[req.body.users[0],req.body.users[1]]}
    });
    
   if(conv!=null){
    console.log(conv +" already");
    res.status(200).json("Already Added"); 
   }else{
        const newconvo  = new Convo({users : req.body.users});
        
        try{
            const data =await newconvo.save();
            res.status(200).json("new conversation saved"); 
        }catch(err){
        res.status(400).json(err);
        }
   }

})

app.delete("/converations/deleteconversations/:connectionId",async(req,res)=>{
     
    console.log("coming convo");
    
       //var result =  await Convo.deleteOne({ _id: req.params.connectionId })
       var result =  await Convo.deleteOne({ "_id": "64ca418ee406fee6902919c2"})
       .then(res=>{ console.log(res);res.status(200).json("conversation deleted");})
       .catch(err=>{res.status(500).json("couldn't delete")});
        console.log(result);
        
})



app.post("/messages/savemessages",async (req,res)=>{
      
    console.log("line 159");
    const messages = await messagemodel.find({conversationId:req.body.conversationId});
    
    if(!messages){
        console.log("line 163");
        const message = new messagemodel(req.body); 

        try{
            const data =await message.save();
            res.status(200).json(data); 
        }catch(err){
           res.status(400).json(err);
        }
    }else{
        for(let message of messages){
            console.log("line 174");
            if(message.from == req.body.from){
                await messagemodel.updateOne({from:req.body.from},{  $push: {"messages":req.body.message}});
            }
        }
    }
    
})


app.get("/messages/getmessages/:conversationId",async (req,res)=>{
     
    try{
        const messages =await messagemodel.find({
            conversationId: {$in:[req.params.conversationId]}
        });
        console.log(messages);
        res.status(200).json(messages); 
    }catch(err){
    res.status(400).json(err);
    }
})

app.post("/upload/uploadimages",upload.single("image"),async (req,res)=>{
    console.log(req.body.userId+" getting id");  
    


    // const img =await imagemodel.replaceOne(
    //     { userid: req.body.userId },
    //     {
    //                 userid:req.body.userId,
    //                 name:req.file.originalname,
    //                 image:{
    //                     data:req.file.buffer,
    //                     contentType:req.file.mimetype
    //                 }
    //     }
    //  );
    //  console.log(img);
    const img =await imagemodel.find({userid:req.body.userId});
    console.log(img);
    if(img[0]!=null){
        console.log("image found");
        await imagemodel.updateOne({userid:req.body.userId},{  $set: {name:req.file.originalname,image:{
            data:req.file.buffer,
            contentType:req.file.mimetype
        }}});
    }else{
        console.log("no image found");
        const image = new imagemodel({
            userid:req.body.userId,
            name:req.file.originalname,
            image:{
                data:req.file.buffer,
                contentType:req.file.mimetype
            }
        }); 
      console.log(req.file);
      await image.save();
      res.status(200).json("image saved");
    }

 })

 app.get("/getimage/:UserId",async (req,res)=>{
    imagemodel.findOne({userid:req.params.UserId}).then(data=>{res.status(200).json(data); console.log();}).catch(err=>{console.log(err); res.status(500).json(err)})
 })


server.listen(port,()=>{console.log("server is running");})


