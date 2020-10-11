

let socket=io();
  var currentUserData;
$(document).ready(function(){
$(".chatUser").click(function(){

var msgdiv=document.querySelector("#mainMessageArea");
  var metadata2={
    receiverUsername:$(this).attr('username'),
    receiverFullname:$(this).attr('fullname'),
    roomid:$(this).attr('roomid'),
    currentUser:$(this).attr('currentUser'),
    currentUserFullname:$(this).attr('currentUserName')
  }
socket.on('connect',function(){
  socket.emit('join',metadata2,function(err){
    if(err){
      alert(err);
    }else{
      console.log("No error");
    }
  });
socket.on("output",function(data){
  console.log(data);
});

var item1=document.querySelector("#createMessageBtn");
var item2=document.querySelector("#createMessage");
$("#createMessageBtn").click(function(){
  var message=$("#createMessage").attr('fullname');
  socket.emit("input",message,function(err){
    if(err){
      alert(err);
    }
  })
})





})

});});
