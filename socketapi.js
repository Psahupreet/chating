const io = require("socket.io")();
const socketapi = {
  io: io,
};

var userModel = require("./routes/users");
var chatModel = require("./routes/chats");
io.on("connection", async function (socket) {
  console.log("User Connected");

  var userId = socket.handshake.auth.token;
  await userModel.findByIdAndUpdate(
    { _id: userId },
    { $set: { is_online: "1" } }
  );
  console.log(userId);
  // User Online Status
  socket.broadcast.emit("getOnlineUser", { user_id: userId });

  socket.on("disconnect", async function () {
    console.log("User Disconnected");
    await userModel.findByIdAndUpdate(
      { _id: userId },
      { $set: { is_online: "0" } }
    );

    // User Offline Status
    socket.broadcast.emit("getOfflineUser", { user_id: userId });
  });

  // Get Chat
  socket.on("newChat", function (data) {
    socket.broadcast.emit("loadNewChat", data);
  });

  // Load Old Chat
  socket.on("existsChat", async function (data) {
    var chats = await chatModel.find({
      $or: [
        { sender_id: data.sender_id, reciever_id: data.reciever_id },
        { sender_id: data.reciever_id, reciever_id: data.sender_id },
      ],
    });
    socket.emit("loadChats", { chats: chats });
  });

  // socket.on("typing",async function (data) {
  //    socket.broadcast.emit("typing", { data });
  //  });
});

module.exports = socketapi;
