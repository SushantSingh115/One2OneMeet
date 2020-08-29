from flask import Flask, render_template, request
from flask_socketio import SocketIO
import initialize
from flask_socketio import send, emit

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = '!23#4567$24%2134$531###'
socketio = SocketIO(app)


def createCaller():
    newCaller = 'caller' + str(initialize.caller)
    initialize.caller = initialize.caller + 1
    return newCaller

def createCallee():
    newCallee = 'callee' + str(initialize.callee)
    initialize.callee = initialize.callee + 1
    return newCallee

def generateMeetinId():
    newMeetingId = 'meet' + str(initialize.meetingId)
    initialize.meetingId = initialize.meetingId + 1
    return newMeetingId

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('generateMeeting')
def generateMeeting():
    newMeetingId = generateMeetinId()
    initialize.meetings[newMeetingId] = {}
    newCaller = createCaller()
    initialize.meetings[newMeetingId][newCaller] = request.sid
    msg = {'meetingId':newMeetingId,'callerid':newCaller}
    emit('meetingCreated', msg)

@socketio.on('enterMeeting')
def enterMeeting(msg):
    meetingId = msg['meetingId']
    caller = msg['caller']
    newCallee = createCallee()
    initialize.meetings[meetingId][newCallee] = request.sid
    room = initialize.meetings[meetingId][caller]
    socketio.emit('userConnected', {'callee': newCallee}, room = room)

@socketio.on('createoffer')
def createoffer(msg):
    print(msg)
    meetingId = msg['meetingId']
    caller = msg['caller']
    callee = msg['connectedUser']
    room = initialize.meetings[meetingId][callee]
    socketio.emit('receiveoffer',
                 {'meetingId':meetingId, 'offer':msg['offer'], 'caller':caller,'callee':callee},
                  room = room)

@socketio.on('answer')
def answer(msg):
    meetingId = msg['meetingId']
    caller = msg['connectedUser']
    room = initialize.meetings[meetingId][caller]
    socketio.emit('answer', msg['answer'],room=room)


@socketio.on('newicecandidate')
def newicecandidate(msg):
    meetingId = msg['meetingId']
    connectedUser = msg['connectedUser']
    room = initialize.meetings[meetingId][connectedUser]
    socketio.emit('ice', msg['ice'], room=room)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)