var meetingId;
var user;
var connectedUser;
var localStream;
var dataChannel;

var connectionobject = peerConnection()

var socket = io()

var btnGenerateMeeting = document.querySelector('#meetingButton')
var meetURL = document.querySelector('#meetURL')
var remoteVideo = document.querySelector('#remoteVideo')

url = window.location.search
if(url.split('=')[1])
{
meetingId = url.split('=')[1].split('&')[0]
caller = url.split('=')[2]
}
if(meetingId){
btnGenerateMeeting.innerHTML = 'Enter Meeting'
}
btnGenerateMeeting.addEventListener ("click", function(){
    if(meetingId){
        socket.emit('enterMeeting',{'meetingId':meetingId,'caller':caller})
    }
    else{
        console.log('Generate Meeting')
        socket.emit('generateMeeting');
    }
})

socket.on('meetingCreated',function(msg){
    rootUrl = window.location.href
    meetURL.innerHTML = rootUrl+'?meetId='+msg.meetingId +'&caller='+msg.callerid
    user = msg.callerid
    meetingId = msg.meetingId
})

socket.on('userConnected',function(msg){
    console.log("User Connected")
    connectedUser = msg.callee
    connectionobject.createOffer({offerToReceiveAudio:true,offerToReceiveAudio:true})
    .then(function(offer){
        return connectionobject.setLocalDescription(offer)}).
        then(function(){
            socket.emit('createoffer',
            {'meetingId':meetingId,
            'connectedUser':connectedUser,
            'offer':connectionobject.localDescription,
            'caller':user})
        }).catch(function(err){
        console.log(err)
    })
})

socket.on('receiveoffer',function(msg){
    connectedUser = msg.caller
    connectionobject.setRemoteDescription(new RTCSessionDescription(msg.offer)).
    then(function(){
    return connectionobject.createAnswer()}).
    then(function(answer){
    return connectionobject.setLocalDescription(answer)}).
    then(function(){
    socket.emit('answer',
        {'meetingId':meetingId,
        'answer':connectionobject.localDescription,
        'connectedUser':connectedUser})
    })
    .catch(function(err){
        console.log(err)
    })
})

socket.on('answer',function(answer){
    connectionobject.setRemoteDescription(new RTCSessionDescription(answer))
})

socket.on('ice', (ice)=>{
    connectionobject.addIceCandidate(ice)
})


function peerConnection(){

    var mediaConstraints = {
        audio:true,
        video: true
    }

    const dataChannelOptions = { ordered: false, maxPacketLifeTime: 3000};
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const connectionobject = new RTCPeerConnection(configuration);
    dataChannel = connectionobject.createDataChannel("dataChannel", dataChannelOptions);
    connectionobject.addEventListener('datachannel', event => {
    console.log("Data Channel Created")
    dataChannel = event.channel;
    });
    navigator.mediaDevices.getUserMedia(mediaConstraints).
    then((stream) => {
        console.log("Google Chrome")
        localVideo = document.querySelector("#localVideo")
        localVideo.srcObject = stream
        localStream = stream
        stream.getTracks().forEach((track => { connectionobject.addTrack(track, stream)}))
    }).catch(function(err){
        console.log(err)
    })
    connectionobject.onicecandidate = function(ev){
        if(ev.candidate){
        socket.emit('newicecandidate',
            {'ice':ev.candidate,
            'connectedUser':connectedUser,
            'meetingId':meetingId})
        }
    }

    const remoteStream = new MediaStream();
    const remoteVideo = document.querySelector('#remoteVideo');
    remoteVideo.srcObject = remoteStream;
    connectionobject.addEventListener('track', async (event) => {
    remoteStream.addTrack(event.track, remoteStream);
    });

    connectionobject.onconnectionstatechange = function(event){
        if(connectionobject.connectionState ==='connected'){
            console.log(connectionobject)
            }
        }

    dataChannel.addEventListener('message', event => {
    message = event.data;
    var recvData = document.querySelector('#recivedMessage')
    recvData.innerHTML += '<p>'+message+'</p>'
    })
    return connectionobject
}

var muteButton = document.querySelector("#muteButton")
var pauseButton = document.querySelector("#pauseButton")

muteButton.onclick = (ev)=>{
    localStream.getTracks()[0].enabled=!localStream.getTracks()[0].enabled
    if(localStream.getTracks()[0].enabled){
        muteButton.innerHTML = "MUTE"
    }else{
    muteButton.innerHTML = "UNMUTE"
    }
}

pauseButton.onclick =(ev)=> {
    localStream.getTracks()[1].enabled=!localStream.getTracks()[1].enabled
    if(localStream.getTracks()[1].enabled){
        pauseButton.innerHTML = "PAUSE Video"
    }else{
        pauseButton.innerHTML = "RESUME Video"
    }
}

var sendMessageButton = document.querySelector("#sendMessage")

sendMessageButton.onclick = (ev)=> {
    console.log("send Message")
    var msgBox = document.querySelector("#msgBox")
    var sentDiv = document.querySelector("#sentMessage")
    msg = msgBox.value
    sentDiv.innerHTML+= ('<p>'+msg+'</p>')
    dataChannel.send(msg)
}


