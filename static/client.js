var meetingId;
var user;
var connectedUser;
var localStream;
var dataChannel;
var meetingStarted;
var connectionobject;

connectionobject = peerConnection()
var chatDiv = document.querySelector("#chatDiv")
var startMeetingButton = document.querySelector("#startMeetingButton")
var waitDiv = document.querySelector("#waitDiv")
var muteButton = document.querySelector("#muteButton")
var pauseButton = document.querySelector("#pauseButton")

startMeetingButton.style.display ="none"
chatDiv.style.display ="none"
muteButton.style.display ="none"
pauseButton.style.display = "none"

var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port, {transports: ['websocket']});

var btnGenerateMeeting = document.querySelector('#meetingButton')
var meetURL = document.querySelector('#meetURL')

startMeetingButton.onclick = function(event){
    waitDiv.style.display = "none"
    meetingStarted = true
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
startMeetingButton.style.display ="none"
}


url = window.location.search
if(url.split('=')[1])
{
meetingId = url.split('=')[1].split('&')[0]
caller = url.split('=')[2]
}
if(meetingId){
btnGenerateMeeting.innerHTML = 'Request to Start the meeting'
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
    waitDiv.innerText = "Wait for User to connect"
})


socket.on('userConnected',function(msg){
    console.log("User Connected")
    connectedUser = msg.callee
    startMeetingButton.style.display = "block"
    waitDiv.innerHTML = "User has joined, Please start the meeting"
})

socket.on('receiveoffer',function(msg){
    btnGenerateMeeting.style.display = "none"
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
    console.log("ice candidate")
    connectionobject.addIceCandidate(ice)
})


function peerConnection(){

    var mediaConstraints = {
        audio:true,
        video:{
        height : 200,
        width: 300
        }
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
        localVideo = document.querySelector("#localVideo")
        localVideo.srcObject = stream
        localStream = stream
        stream.getTracks().forEach((track => { connectionobject.addTrack(track, stream)}))
        muteButton.style.display ="block"
        pauseButton.style.display = "block"
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
    connectionobject.addEventListener('track', (event) => {
    console.log("remote Stream")
    remoteStream.addTrack(event.track, remoteStream);
    });

    connectionobject.onconnectionstatechange = function(event){
        if(connectionobject.connectionState ==='connected'){
            console.log(connectionobject)
            chatDiv.style.display = "block"
            }
        }

    dataChannel.addEventListener('message', event => {
    message = event.data;
    var recvData = document.querySelector('#recivedMessage')
    recvData.innerHTML += '<p>'+message+'</p>'
    })
    return connectionobject
}



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


