

const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const multer=require('multer');

const http = require('http');
const socketIO = require('socket.io');
const path=require('path');
const app=express();
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const port = process.env.PORT || 3000
let server = http.createServer(app);
let io = socketIO(server);
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,

}));
app.use(passport.initialize());
app.use(passport.session());


app.use(express.json());




mongoose.connect("mongodb://localhost:27017/instaConnectionsDB",{useNewUrlParser:true, useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);
const messageSchema=new mongoose.Schema({
  name:String,
  text:String,
  dateCreated:String
});
const Message=new mongoose.model("Message",messageSchema);
const chatUsersSchema=new mongoose.Schema({
  fullname:String,
  roomid:String,
  username:String,
  chats:[messageSchema]
});
const ChatUser=new mongoose.model("ChatUser",chatUsersSchema);
const chatSchema=new mongoose.Schema({
  currentUser:String,
  fullname:String,
  chatusers:[chatUsersSchema]
});
const Chat=new mongoose.model("Chat",chatSchema);


const commentSchema=new mongoose.Schema({
  userId:String,
  requestId:String,
  username:String,
  comment:String,
  fullname:String,
  createdDate:Date
});
const Comment=new mongoose.model("Comment",commentSchema);
const requestSchema=new mongoose.Schema({
  fullname:String,
  country:String,
  gender:String,
  catagory:String,
  subcatagory:String,
  description:String,
  time:Date,
  level:String,
  comments:[commentSchema]
});
const Request=new mongoose.model("Request",requestSchema);
const profiledetailsschema=new mongoose.Schema({
  username:String,
  imgurl:String,
  intrests:String,
  bio:String,
  fullname:String,
  country:String
});
const userSchema=new mongoose.Schema({
  fullname:String,
  username:String,
  password:String,
  gender:String,
  country:String,
  requests:requestSchema,
  profiledetails:profiledetailsschema
});

const storage=multer.diskStorage({
  destination:'public/uploads',
  filename:function(req,file,cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload=multer({
  storage:storage,
  fileFilter:function(req,file,cb){
    checkFileType(file,cb);
  }
}).single('myImage');

function checkFileType(file,cb){
  //Allowed extensions
  const filetypes=/jpeg|jpg|png|gif/;
  //check ext
  const extname=filetypes.test(path.extname(file.originalname).toLowerCase());
  //check mime
  const mimetype=filetypes.test(file.mimetype);
  if(mimetype&&extname){
    return cb(null,true);

  }else{
    cb('Error : Images only');
  }

}
userSchema.plugin(passportLocalMongoose);
const ProfileDetail=new mongoose.model("ProfileDetail",profiledetailsschema);

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//routes
app.get("/",function(req,res){
  res.render("home");

});

app.get("/login",function(req,res){

  res.render('login');


});
app.get("/register",function(req,res){
  res.render("register");
});

var profileDetails="";
app.get("/main",function(req,res){
  if(req.isAuthenticated()){
    Request.find({},function(err,foundPosts){
      if(err){

      }else{

      User.find({username:req.user.username},{profiledetails:1},function(err,foundDetails){
          if(err){
            console.log(err);
          }else{

            foundDetails.forEach(function(item){

                  profileDetails=item.profiledetails;
 res.render("main",{foundPosts:foundPosts,currentUser:req.user,profileDetails:profileDetails});
            });

          }
        });

      }
    });


  }else{
    res.redirect("/login");
  }


});
app.get("/catagories",function(req,res){

});
app.get("/newr-equest",function(req,res){
  if(req.isAuthenticated()){
    res.render("new-request.ejs");
  }else {
    res.redirect("/login");
  }

});
app.get("/editprofile",function(req,res){
    User.find({username:req.user.username},{profiledetails:1},function(err,foundDetails){
      if(err){
        res.render("editprofile");
      }else{
        foundDetails.forEach(function(item){
          profileDetails=item.profiledetails;
          res.render("editprofile",{profileDetails:profileDetails});
        })
      }
    })



})
var username1="";
app.post("/editprofile",function(req,res){

  username1=req.user.username;
  upload(req,res,function(err){
    if(err){
      res.render('editprofile',{msg:err});
    }else{
      if(req.file===undefined){
        User.updateOne({username:username1},{$set:{profiledetails:{username:username1,
        intrests:req.body.intrests,bio:req.body.bio,country:req.user.country,fullname:req.user.fullname}}},function(err){
          if(err){
            console.log(err);
          }
        });
    res.redirect("/main");
   }
     else{

       User.updateOne({username:username1},{$set:{profiledetails:{username:username1,
       imgurl:`uploads/${req.file.filename}`,intrests:req.body.intrests,bio:req.body.bio,country:req.user.country,fullname:req.user.fullname}}},function(err){
         if(err){
           console.log(err);
         }
       });

       res.redirect("/main");

    }
  }});

});
app.get("/messages2",function(req,res){




  res.send({currentUser:req.user.username,fullname:req.user.fullname});
});
io.on('connection',function(socket){
  console.log("A new user just got connected");


  socket.on("join",(metadata2,callback)=>{
    socket.join(metadata2.roomid)
  console.log(metadata2);
  Chat.find({"currentUser" : metadata2.currentUser},{"chatusers":{"$elemMatch":{"username":metadata2.receiverUsername}}},function(err,data){
  socket.emit('output', data);

  })

})
socket.on("input",function(data,callback){
  console.log(data);
})

io.on('disconnect',function(){
  console.log("User is disconnected");
})



})

app.get("/messages",function(req,res){





Chat.find({currentUser:req.user.username},{chatusers:1},function(err,data){
  data.forEach(function(item){
    item.chatusers.forEach(function(ob){

    });
      res.render("messages.ejs",{foundUsers:item.chatusers,currentUser:req.user.username,currentUserName:req.user.fullname});
  })

});

});
app.get("/search",function(req,res){
  Request.find({},function(err,foundPosts){
      res.render("search",{foundPosts:foundPosts});
  });

});
app.get("/:postId",function(req,res){
  if(req.params.postId==="profiles"){

    User.find({},{profiledetails:1},function(err,items){
      if(err){
        console.log(err);
      }else{

  res.render("community",{profiles:items});


      }
    })
  }
  else{
    Request.find({_id:req.params.postId},function(err,item){
      if(err){

      }else {

        item.forEach(function(post){

          res.render('post',{data:post,currentUserFullname:req.user.fullname,currentUserUsername:req.user.username,currentUserId:req.user._id,comments:post.comments});
        })

      }
    });
  }




});


function generateRoomID(u1,u2){
  var generatedRoomId;
var name1=u1.substring(0, u1.lastIndexOf("@"));
var name2=u2.substring(0, u2.lastIndexOf("@"));
if(name1>name2){
  generatedRoomId=name1.concat(name2);
}else{
  generatedRoomId=name2.concat(name1);
}
return generatedRoomId;
}

app.post("/messages",function(req,res){

// NOTE:  This is 0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg

Chat.findOne({currentUser:req.body.receiverEmail},function(err,data){
  if(!data){
    const time=new Date().getTime();
    const cu1=new ChatUser({
      fullname:req.body.receiverName,
        roomid:generateRoomID(req.body.receiverEmail,req.user.username),
        username:req.body.receiverEmail
    });
    const user1=new Chat({
      fullname:req.user.fullname,
      currentUser:req.user.username,
      chatusers:cu1
    });
    user1.save();
    // Chat.find({currentUser:req.body.receiverName},function(err,data){
    //   if(!data){
    //     const cu2=new ChatUser({
    //       fullname:req.
    //     })
    //   }
    // })


  }else{

    Chat.find({currentUser:req.body.receiverEmail},{chatusers:1},function(err,data){
      var found=-1;
      data.forEach(function(datam){
      datam.chatusers.forEach(function(item){

      if(item.username===req.user.username){
        console.log(item.username);
        found=1;
        return;
      }


      })
      if(found===-1){
        const time=new Date().getTime();
        const cu=new ChatUser({
          fullname:req.user.fullname,
            roomid: generateRoomID(req.body.receiverEmail,req.user.username),
            username:req.user.username
        });

        Chat.updateOne({currentUser:req.body.receiverEmail},{$push:{chatusers:cu}},function(err){
          if(err){
            console.log(err);
          }
          else{

          }
        });
      }

});
});
}
});




// NOTE:  this is testing










  Chat.findOne({currentUser:req.user.username},function(err,data){
    if(!data){
      const time=new Date().getTime();
      const cu1=new ChatUser({
        fullname:req.body.receiverName,
          roomid:generateRoomID(req.body.receiverEmail,req.user.username),
          username:req.body.receiverEmail
      });
      const user1=new Chat({
        fullname:req.body.receiverName,
        currentUser:req.body.receiverEmail,
        chatusers:cu1
      });
      user1.save();
      // Chat.find({currentUser:req.body.receiverName},function(err,data){
      //   if(!data){
      //     const cu2=new ChatUser({
      //       fullname:req.
      //     })
      //   }
      // })
  res.redirect("/messages");

    }else{

      Chat.find({currentUser:req.user.username},{chatusers:1},function(err,data){
        var found=-1;
        data.forEach(function(datam){
        datam.chatusers.forEach(function(item){

        if(item.username===req.body.receiverEmail){
          console.log(item.username);
          found=1;
          return;
        }


        })
        if(found===-1){
          const time=new Date().getTime();
          const cu=new ChatUser({
            fullname:req.body.receiverName,
              roomid: generateRoomID(req.body.receiverEmail,req.user.username),
              username:req.body.receiverEmail
          });

          Chat.updateOne({currentUser:req.user.username},{$push:{chatusers:cu}},function(err){
            if(err){
              console.log(err);
            }
            else{

            }
          });
        }
    res.redirect("/messages");
});
});
}
});

});






//post routes
app.post("/register",function(req,res){
User.register({username:req.body.username,
fullname:req.body.fullname,
country:req.body.country,
gender:req.body.gender
},req.body.password,function(err,user){
  if(err){
     console.log(err);
     res.redirect("/register");
  }
  else{
    passport.authenticate("local")(req,res,function(){

      res.redirect("/main");
    });
  }
})



});

app.post("/login",function(req,res){

  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        console.log("User entered successfully");
        res.redirect("/main");
      });
    }
  });
});

app.post("/new-request",function(req,res){
var time=new Date().getTime();
const post=new Request({
  fullname:req.body.fullname,
  country:req.body.country,
  gender:req.body.gender,
  level:req.body.level,
  catagory:req.body.catagory,
  subcatagory:req.body.subsctagory,
  description:req.body.description,
  time:time
});

User.updateOne({username:req.user.username},{$push:{requests:post}},function(err){
  if(err){
    console.log(err);
  }
});
post.save();
res.redirect("/main");
});

app.post("/search",function(req,res){


  if(!req.body.subsctagory){
    Request.find({catagory:req.body.catagory},function(err,foundPosts){
      if(err){

      }else{

        res.render("search",{foundPosts:foundPosts})
     }
   });
  }else{
    Request.find({catagory:req.body.catagory,subcatagory:req.body.subsctagory},function(err,foundPosts){
      if(err){

      }else{

        res.render("search",{foundPosts:foundPosts})
     }
   });
  }


});

app.post("/post/comment",function(req,res){

var time=new Date().getTime();
var newComment=new Comment({
  userId:req.body.userId,
  requestId:req.body.requestId,
  username:req.body.username,
  comment:req.body.comment,
  fullname:req.body.fullname,
  createdDate:time
});
Request.findByIdAndUpdate(req.body.requestId,{$push:{comments:newComment}},function(err){
  if(err){
    console.log(err);
  }else{
    res.redirect("/main");
  }
});
});



// app.listen(3000,function(){
//   console.log("Connected to server at port 3000");
// });

server.listen(port,function(){
  console.log("Server is up");
})
