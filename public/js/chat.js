const socket = io();

//Elements
const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');
const locationButton = document.querySelector('#location-btn')
const messageDiv = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, roomname } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const newMessage = messageDiv.lastElementChild;

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messageDiv.offsetHeight;

    const containerHeight = messageDiv.scrollHeight;

    const scrollOffset = messageDiv.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        messageDiv.scrollTop = messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.message,
        createdAt: moment(message.createdAt).format("h:mm:ss a"),
    });
    messageDiv.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (locationLink) => {
    console.log(locationLink);

    const html = Mustache.render(locationTemplate, {
        username: locationLink.username,
        URL: locationLink.url,
        createdAt: moment(locationLink.createdAt).format("h:mm:ss a"),
    });
    messageDiv.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ roomname, userList }) => {
    const html = Mustache.render(sidebarTemplate, {
        roomname,
        userList,
    })

    document.querySelector('#sidebar').innerHTML = html;
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log('confirmation received');
    });
})


locationButton.addEventListener('click', () => {

    locationButton.setAttribute('disabled', 'disabled');

    if (!navigator.geolocation) {
        return alert("Geolocation no supported in your browser.");
    }
    navigator.geolocation.getCurrentPosition((position) => {


        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, (error) => {
            locationButton.removeAttribute('disabled');
            if (error) {
                return console.log(error);
            }
            console.log('location shared');
        });
    })
})

socket.emit('join', { username, roomname }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});