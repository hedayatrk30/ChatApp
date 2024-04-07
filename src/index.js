const { doesNotMatch } = require('assert');
const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/genMessage');
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const port = process.env.PORT || 3000

const pathDir = path.join(__dirname, '../public');

app.use(express.static(pathDir));


app.get('/', (req, res) => {
    res.render('index');
})

io.on('connection', (socket) => {
    console.log('New connection');

    socket.on('join', ({ username, roomname }, callback) => {
        const { error, user } = addUser({
            id: socket.id,
            username,
            roomname
        })

        if (error) {
            return callback(error);
        }

        socket.join(user.roomname);

        socket.emit('message', generateMessage("Welcome!"));
        socket.broadcast.to(user.roomname).emit('message', generateMessage(`${user.username} has joined`));
        io.to(user.roomname).emit('roomData', {
            roomname: user.roomname,
            userList: getUserInRoom(user.roomname),
        })
        callback();
    })

    socket.on('sendMessage', (msg, callback) => {

        const user = getUser(socket.id);
        
        io.to(user.roomname).emit('message', generateMessage(user.username, msg));
        callback();
    })

    socket.on('sendLocation', (position, callback) => {
        // io.emit('message', `https://google.com/maps?q=${position.latitude},${position.longitude}`)

        const user = getUser(socket.id);

        io.to(user.roomname).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`));
        callback();
    })
    

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.roomname).emit('message', generateMessage(`${user.username} has left the chat |><|`));
            io.to(user.roomname).emit('roomData', {
                roomname: user.roomname,
                userList: getUserInRoom(user.roomname),
            })
        }
    })

})

server.listen(port, () => {
    console.log(`The server is up and running at ${port}`);
})