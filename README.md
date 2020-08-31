About Application
A webrtc based demo applicatin for nstant one to one conferencing. Application is deployed on heroku.

Application Link
https://immense-ravine-65935.herokuapp.com/ 

Note

In case of chrome if the application does not asks for audio & video permission then go to site settings and allow for camera & microphone. On page load please allow use of camera and microphone.

Features
1. One to One Video Conferencing App
2. One to One chat

Technology

1. Javascript
2. Flask-SocketiO
3. Webrtc
4. socket.io


User Roles

1. Host - One who starts a meeting 
2. Participant - One who participates in the meeting

How it works?

Host End:

1. Host clicks on the 'Generate Meeting URL' to generate meeting url.

2. Share the meeting url to the other person or participant

3. Participant clicks on the 'Request to Start Meeting Button' to request for meeting start.

4. Host gets alert to start the meeting.

5. Host clicks on start meeting button to start the meeting.



Files:

1. index.html - Frontend of the application.

2. client.js - Webrtc Implemetation & interatction with signalling server

3. app.py - Signalling server

4. initialize.py - initializes variables

Diretcory Structure:

├── app.py
├── initialize.py
├── Procfile
├── requirements.txt
├── runtime.txt
├── static
│   └── client.js
├── templates
│   └── index.html