const { hash, hashSync } = require("bcrypt");
const mongoose = require("mongoose");
require("dotenv").config();


mongoose.connect(process.env.DATABASE,{ useNewUrlParser: true }).then(()=>{console.log("success from database")});

const Users = new mongoose.Schema({
    email :{
        type:String 
    },
    name :{
        type:String
    },
    password :{
        type : String
    }
},{timestamps :true})

const conversationmodel = new mongoose.Schema({

    users :[{
        type:String 
    }]
},{timestamps :true})

const messagesnmodel = new mongoose.Schema({
    
    conversationId : {type:String},
    from:{
        type:String 
    },
    to:{
        type:String
    },
    messages :[{
        type:String 
    }]
},{timestamps :true})

const imageSchema = new mongoose.Schema({
    userid:String,
    name : String,
    image:{
        data:Buffer,
        contentType:String 
    },
    message :{
        type : String
    }
},{timestamps :true})

const users =new mongoose.model("users",Users);
const Convo =new mongoose.model("conversations",conversationmodel);
const messagemodel =new mongoose.model("messages",messagesnmodel);
const imagemodel =new mongoose.model("profileimages",imageSchema);
module.exports = {users , Convo ,messagemodel,imagemodel}