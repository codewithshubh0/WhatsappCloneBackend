const express  = require("express");
const app = express();
require("dotenv").config();
const cors =require("cors");
const port = process.env.port || 8000;
const {users,Convo, messagemodel,imagemodel,allonlineusers} = require("./database")
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

    socket.on("disconnect",async () => 
    {
        console.log("Connection Lost")
        io.in().emit('user left', {msg: "user left"});
    }
);

    socket.on("joinning",async (data)=>{
        console.log(data.msg+" on login "+ data.username);

        socket.join(data.room);
        //console.log("user= "+data.user + ", room= "+data.room );
       io.in(data.room).emit("new user joined" , {user:data.username,message:"user joined"})
    })

   socket.on("message",async (data)=>{
        socket.join(data.room);
       // console.log("user= "+data.user + ", room= "+data.room );
       io.in(data.room).emit("new message" , {user:data.user,message:data.message,date:data.date,room:data.room})

    })


     socket.on("disconnected",async (data)=>{
        console.log(data.msg+" left "+ data.username);
        socket.join(data.room);
       // console.log("user= "+data.user + ", room= "+data.room );
       io.in(data.room).emit("user left" , {user:data.username,message:data.message})

    })
});

app.post("/users/getonlineusers",async(req,res)=>{ 
    const allonlineusersarray = await allonlineusers.find({'onlineusers':req.body.user})
    if(allonlineusersarray[0]==null){
        console.log("not found");
        return res.status(200).json('offline')
    }else{
        console.log(allonlineusersarray);
         return res.status(200).json('online')  
    }     
  
})

app.post("/users/getlastmsg",async(req,res)=>{ 
    const data = await messagemodel.findOne({conversationId:req.body.connid},{'messages':{$slice: -1}})
    if(data==null){
        console.log("not found");
        return res.status(200).json('not found')
    }else{
        console.log(data.messages);
         return res.status(200).json(data.messages)  
    }     
  
})

app.post("/users/storeonlineusers",async(req,res)=>{ 
    const addonlineusersarray = await allonlineusers.findOneAndUpdate({_id:'6623689f1b5444c3ba1d2f8e'},{$push:{
        'onlineusers':req.body.user
    }
    })
    if(!addonlineusersarray){
        return res.status(200).json("not added")
    }else{
       // console.log(user);
         return res.status(200).json("added")  
    }     
  
})

app.post("/users/removeonlineusers",async(req,res)=>{ 
 

    const removeonlineusersarray = await allonlineusers.findOneAndUpdate({_id:'6623689f1b5444c3ba1d2f8e'},{$pull:{
        'onlineusers':req.body.user
    }
    })
    if(!removeonlineusersarray){
        return res.status(200).json("not added")
    }else{
       // console.log(user);
         return res.status(200).json("added")  
    }     
  
})
app.post("/users/saveusers", async(req,res)=>{ 
const {email, name , password} = req.body;
    
    try{
        const checkusers =await users.find({
            email : {$in :[email]}
        })
       // console.log(checkusers);
      if(checkusers[0]==null){ 

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newuser = new users({email,name,password:passwordHash})
        const result =await newuser.save();
        return res.status(200).json("1") 
       }else{
        return res.status(200).json("2")
       }
       
    }catch(err){
       return res.status(400).json(err);
    }
})

app.post("/users/checkuser", async(req,res)=>{ 
    const {email,password,checkpass} = req.body;
    
    
    try{
    
    const user = await users.findOne({email:email})
    if(!user){
        return res.status(200).json("User Not Found")
    }else{
        const validpassword = await bcrypt.compare(password , user.password);
        if((checkpass=='true') && !validpassword){
            return res.status(200).json("wrong password")
        }else{

            return res.status(200).json(user)
            
        }     
    } 
}catch(err){
       return res.status(400).json(err);
    }
})

app.get("/users/getUserToAdd/:username", async(req,res)=>{ 
    try{
    const user = await users.findOne({name:req.params.username})
    if(!user){
        return res.status(200).json("-1")
    }else{
       // console.log(user);
         return res.status(200).json(user)  
    }     
}catch(err){
       return res.status(400).json(err);
    }
})

// app.get("/users/getUserId/:username", async(req,res)=>{ 
//     try{
//     const user = await users.findOne({name:req.params.username})
//     if(!user){
//         return res.status(200).json("-1")
//     }else{
//         console.log(user);
//          return res.status(200).json(user)  
//     }     
// }catch(err){
//        return res.status(400).json(err);
//     }
// })

app.get("/users/:UserId",async (req,res)=>{
     
    var friends = {}
    try{
        const conversation =await Convo.find({
            users : {$in: [req.params.UserId ]}
        });
       // console.log(conversation+" all convo");
        if(conversation!=[]){
           
             for(let convId of conversation){
                
                const user1 = convId.users[0];
                const user2 = convId.users[1];
                if(user1!==undefined && user2!==undefined){


                if(user1!=req.params.UserId){
                    const user = await users.findOne({_id:user1})

                   // console.log(user.name+" user to add");
                    if(user==null){
                        //console.log("null user1"+user1);
                     }
                  friends[user.name] = convId._id;
                }else{

                 const user = await users.findOne({_id:user2})
                 if(user==null){
                   //console.log("null user2"+user2);
                 }
                  friends[user.name] = convId._id;
                }
                //console.log(friends + "all friends");
             }else{
                return res.status(200).json("something went wrong!");
             }
           
            }
           // console.log(JSON.stringify(friends)+" all friends");
            return res.status(200).json(friends); 
        }else{
            return res.status(200).json([]); 
        }
    
    }catch(err){
      return res.status(400).json(err);
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
//              return res.status(200).json(friends); 
//         }else{
//             return res.status(200).json([]); 
//         }
        
//     }catch(err){
//        return res.status(400).json(err);
//     }
// })


app.post("/converations/storeconversations",async(req,res)=>{
     
    console.log("coming convo");


    const conv =await Convo.findOne({
        users: {$all:[req.body.users[0],req.body.users[1]]}
    });
    
   if(conv!=null){
    console.log(conv +" already");
    return res.status(200).json("Already Added"); 
   }else{
        const newconvo  = new Convo({users : req.body.users});
        
        try{
            const data =await newconvo.save();

            const newmessagesdata  = new messagemodel(
                {
                    conversationId : data._id,
                    messages:[]
                });
               await newmessagesdata.save();
            return res.status(200).json("new conversation saved"); 
        }catch(err){
           return res.status(400).json(err);
        }
   }

})

app.delete("/converations/deleteconversations/:connectionId",async(req,res)=>{
     
    console.log("coming convo");
    
       //var result =  await Convo.deleteOne({ _id: req.params.connectionId })
       var result =  await Convo.deleteOne({ _id: req.params.connectionId});

       if(result!=null){
           return res.status(200).json("conversation deleted");
       }else{
           return res.status(500).json("couldn't delete")
        }
    //    .then(res=>{ console.log(res);return res.status(200).json("conversation deleted");})
    //    .catch(err=>{return res.status(500).json("couldn't delete")});
    //     console.log(result);
        
})



app.post("/messages/savemessages",async (req,res)=>{
    const updatemessags = await messagemodel.findOneAndUpdate({conversationId:req.body.connid},{$push:{
        messages:{
            from:req.body.from,
            message:req.body.message,
            dateandtime:req.body.date
        }
    }})     
    if(updatemessags){
        console.log("message updated");
    }

    return res.status(200).json("message updated");
})

app.post("/messages/clearchatmessages",async (req,res)=>{
    const updatemessags = await messagemodel.findOneAndUpdate({conversationId:req.body.connid},{$pull:{
        messages:{}
    }})     
    if(updatemessags){
        console.log("chat cleared");
    }

    return res.status(200).json("chat cleared");
})


app.get("/messages/getmessages/:conversationId",async (req,res)=>{
     
    try{
        const messages =await messagemodel.find({
            conversationId: {$in:[req.params.conversationId]}
        });
        console.log(messages);
        return res.status(200).json(messages); 
    }catch(err){
    return res.status(400).json(err);
    }
})

app.post("/upload/uploadimages",upload.single("image"),async (req,res)=>{
    console.log(req.body.userId+" getting id");  
    

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
      return res.status(200).json("image saved");
    }

 })

 app.get("/getimage/:UserId",async (req,res)=>{
    imagemodel.findOne({userid:req.params.UserId}).then(data=>{return res.status(200).json(data); console.log();}).catch(err=>{console.log(err); return res.status(500).json(err)})
 })


server.listen(port,()=>{console.log("server is running");})


