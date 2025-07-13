// 📦 Imports: React, socket.io, Material UI, styling, icons, and environment config
import React, { useEffect, useRef, useState } from 'react'; // React hooks for state and lifecycle
import io from 'socket.io-client'; // Socket.IO client for real-time communication
import { Badge, IconButton, TextField, Button } from '@mui/material'; // Material UI components for UI
import { Videocam, VideocamOff, CallEnd, Mic, MicOff, ScreenShare, StopScreenShare, Chat } from '@mui/icons-material'; // Material UI icons
import styles from "../styles/videoComponent.module.css"; // CSS module for styling
import server from '../environment'; // Server URL from environment config

const server_url = server; // Assign server URL for Socket.IO connection
let connections = {}; // Object to store RTCPeerConnections for each user
const peerConfigConnections = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // STUN server for NAT traversal in WebRTC

export default function VideoMeetComponent() {
  // 🔁 Refs for socket, video, etc.
  const socketRef = useRef(); // Ref for Socket.IO instance
  const socketIdRef = useRef(); // Ref for current user's socket ID
  const localVideoref = useRef(); // Ref for local video element
  const videoRef = useRef([]); // Ref to store remote users' video objects

  // 🔘 State hooks for media, UI, and chat
  const [videoAvailable, setVideoAvailable] = useState(true); // Tracks if video device is available
  const [audioAvailable, setAudioAvailable] = useState(true); // Tracks if audio device is available
  const [video, setVideo] = useState(); // Controls video stream on/off
  const [audio, setAudio] = useState(); // Controls audio stream on/off
  const [screen, setScreen] = useState(); // Controls screen sharing on/off
  const [screenAvailable, setScreenAvailable] = useState(); // Tracks if screen sharing is supported
  const [showModal, setModal] = useState(true); // Toggles chat modal visibility
  const [askForUsername, setAskForUsername] = useState(true); // Toggles username input (lobby) screen
  const [username, setUsername] = useState(""); // Stores user's username
  const [videos, setVideos] = useState([]); // Stores remote video streams
  const [messages, setMessages] = useState([]); // Stores chat messages
  const [message, setMessage] = useState(""); // Stores current chat input
  const [newMessages, setNewMessages] = useState(3); // Tracks unread chat messages

  // 🔐 Get media device permissions on mount
  useEffect(() => { getPermissions(); }, []); // Runs getPermissions on component mount

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // Requests camera/mic access
      setVideoAvailable(true); // Set video as available
      setAudioAvailable(true); // Set audio as available
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia); // Check if screen sharing is supported
      window.localStream = stream; // Store stream globally
      localVideoref.current.srcObject = stream; // Set local video element's source to stream
    } catch (err) { console.error("Media Error:", err); } // Log errors if permissions fail
  };

  // 👁️ Trigger getUserMedia again when toggling audio/video
  useEffect(() => { if (video !== undefined && audio !== undefined) getUserMedia(); }, [video, audio]); // Re-runs getUserMedia when video/audio state changes

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) { // Check if video/audio is enabled and available
      navigator.mediaDevices.getUserMedia({ video, audio }) // Request new media stream
        .then(getUserMediaSuccess).catch(console.error); // Handle success or error
    } else {
      stopTracks(); // Stop tracks if video/audio is disabled
    }
  };

  const getUserMediaSuccess = (stream) => {
    stopTracks(); // Stop any existing tracks
    window.localStream = stream; // Update global stream
    localVideoref.current.srcObject = stream; // Update local video element
    for (let id in connections) { // Iterate through all peer connections
      if (id === socketIdRef.current) continue; // Skip self
      connections[id].addStream(stream); // Add stream to peer connection
      connections[id].createOffer().then(desc => { // Create WebRTC offer
        connections[id].setLocalDescription(desc).then(() => { // Set local description
          socketRef.current.emit('signal', id, JSON.stringify({ sdp: desc })); // Send SDP to peer
        });
      });
    }
  };

  const stopTracks = () => {
    try {
      localVideoref.current.srcObject.getTracks().forEach(track => track.stop()); // Stop all tracks in local stream
    } catch {} // Ignore errors (e.g., if no tracks exist)
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false }); // Connect to Socket.IO server
    socketRef.current.on('signal', gotMessageFromServer); // Listen for WebRTC signaling messages
    socketRef.current.on('connect', () => { // On successful connection
      socketRef.current.emit('join-call', window.location.href); // Join call with current URL
      socketIdRef.current = socketRef.current.id; // Store socket ID

      socketRef.current.on('chat-message', addMessage); // Listen for chat messages
      socketRef.current.on('user-left', id => { // Handle user disconnection
        setVideos(prev => prev.filter(v => v.socketId !== id)); // Remove disconnected user's video
      });

      socketRef.current.on('user-joined', (id, clients) => { // Handle new user joining
        clients.forEach(socketListId => { // Iterate through all clients
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections); // Create new peer connection
          connections[socketListId].onicecandidate = e => { // Handle ICE candidates
            if (e.candidate) socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: e.candidate })); // Send ICE candidate
          };
          connections[socketListId].onaddstream = event => { // Handle incoming stream
            const exists = videoRef.current.find(v => v.socketId === socketListId); // Check if video exists
            const newVideo = { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true }; // Create video object
            const update = exists
              ? videoRef.current.map(v => v.socketId === socketListId ? newVideo : v) // Update existing video
              : [...videoRef.current, newVideo]; // Add new video
            videoRef.current = update; // Update ref
            setVideos(update); // Update state
          };

          if (window.localStream) connections[socketListId].addStream(window.localStream); // Add local stream to peer
        });

        if (id === socketIdRef.current) { // If current user
          for (let id2 in connections) { // Iterate through connections
            if (id2 === socketIdRef.current) continue; // Skip self
            connections[id2].createOffer().then(desc => { // Create offer
              connections[id2].setLocalDescription(desc).then(() => { // Set local description
                socketRef.current.emit('signal', id2, JSON.stringify({ sdp: desc })); // Send SDP
              });
            });
          }
        }
      });
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message); // Parse incoming signal
    if (fromId === socketIdRef.current) return; // Ignore messages from self

    if (signal.sdp) { // Handle SDP (Session Description Protocol)
      connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => { // Set remote description
        if (signal.sdp.type === 'offer') { // If it's an offer
          connections[fromId].createAnswer().then(desc => { // Create answer
            connections[fromId].setLocalDescription(desc).then(() => { // Set local description
              socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: desc })); // Send answer
            });
          });
        }
      });
    }

    if (signal.ice) { // Handle ICE candidate
      connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.error); // Add ICE candidate
    }
  };

  const addMessage = (data, sender, senderId) => {
    setMessages(prev => [...prev, { sender, data }]); // Add new chat message
    if (senderId !== socketIdRef.current) setNewMessages(prev => prev + 1); // Increment unread messages for non-self messages
  };

  const sendMessage = () => {
    socketRef.current.emit('chat-message', message, username); // Send chat message
    setMessage(""); // Clear input
  };

  const black = ({ width = 640, height = 480 } = {}) => { // Creates a black video track
    let canvas = Object.assign(document.createElement("canvas"), { width, height }); // Create canvas
    canvas.getContext('2d').fillRect(0, 0, width, height); // Fill with black
    let stream = canvas.captureStream(); // Capture stream
    return Object.assign(stream.getVideoTracks()[0], { enabled: false }); // Return disabled video track
  };

  const silence = () => { // Creates a silent audio track
    let ctx = new AudioContext(), osc = ctx.createOscillator(), dst = osc.connect(ctx.createMediaStreamDestination()); // Create audio context
    osc.start(); ctx.resume(); // Start oscillator
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false }); // Return disabled audio track
  };

  const handleVideo = () => setVideo(!video); // Toggle video on/off
  const handleAudio = () => setAudio(!audio); // Toggle audio on/off
  const handleScreen = () => setScreen(!screen); // Toggle screen sharing
  const handleEndCall = () => { stopTracks(); window.location.href = "/"; }; // End call and redirect
  const connect = () => { setAskForUsername(false); setVideo(videoAvailable); setAudio(audioAvailable); connectToSocketServer(); }; // Join call

  // 📦 Render Lobby or Meet Room
  return (
    <div>
      {askForUsername ? ( // Show lobby if username is required
        <div>
          <h2>Enter into Lobby</h2>
          <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} /> // Username input
          <Button variant="contained" onClick={connect}>Connect</Button> // Connect button
          <video ref={localVideoref} autoPlay muted /> // Local video preview
        </div>
      ) : ( // Show meeting room
        <div className={styles.meetVideoContainer}>
          {showModal && ( // Show chat modal if enabled
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length ? messages.map((msg, i) => ( // Display chat messages
                    <div key={i}><p><b>{msg.sender}</b></p><p>{msg.data}</p></div>
                  )) : <p>No Messages Yet</p>} // Show placeholder if no messages
                </div>
                <div className={styles.chattingArea}>
                  <TextField value={message} onChange={e => setMessage(e.target.value)} label="Enter Your chat" /> // Chat input
                  <Button variant='contained' onClick={sendMessage}>Send</Button> // Send message button
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>{video ? <Videocam /> : <VideocamOff />}</IconButton> // Video toggle
            <IconButton onClick={handleEndCall} style={{ color: "red" }}><CallEnd /></IconButton> // End call
            <IconButton onClick={handleAudio} style={{ color: "white" }}>{audio ? <Mic /> : <MicOff />}</IconButton> // Audio toggle
            {screenAvailable && ( // Show screen share button if supported
              <IconButton onClick={handleScreen} style={{ color: "white" }}>{screen ? <ScreenShare /> : <StopScreenShare />}</IconButton>
            )}
            <Badge badgeContent={newMessages} color='orange'> // Chat button with unread message badge
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}><Chat /></IconButton>
            </Badge>
          </div>

          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted /> // Local video in meeting
          <div className={styles.conferenceView}>
            {videos.map(video => ( // Render remote videos
              <div key={video.socketId}>
                <video data-socket={video.socketId} ref={ref => ref && (ref.srcObject = video.stream)} autoPlay /> // Remote video element
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Explanation Summary
This React component implements a video conferencing application using WebRTC for peer-to-peer media streaming and Socket.IO for signaling and chat functionality. Here's a high-level overview:

Imports and Setup:
Imports React hooks, Socket.IO, Material UI components, icons, and CSS styles.
Defines server_url for Socket.IO connection and connections for storing WebRTC peer connections.
Uses a STUN server for NAT traversal in WebRTC.
State and Refs:
Uses useRef for persistent references to Socket.IO instance, socket ID, local video element, and remote video streams.
Uses useState for managing video/audio availability, toggles, screen sharing, chat messages, and UI states (e.g., username input, chat modal).
Media Handling:
getPermissions: Requests camera/microphone access on mount and sets up local video stream.
getUserMedia: Updates media stream when video/audio toggles change, adding streams to peer connections.
stopTracks: Stops all media tracks when disabling video/audio.
Socket.IO and WebRTC:
connectToSocketServer: Establishes Socket.IO connection, handles signaling (signal event), chat messages (chat-message), user joins (user-joined), and user leaves (user-left).
gotMessageFromServer: Processes WebRTC signaling messages (SDP and ICE candidates) to establish peer connections.
Creates and manages RTCPeerConnection for each user, handling offer/answer exchanges and ICE candidates.
Chat Functionality:
addMessage: Adds incoming chat messages to state and increments unread message count.
sendMessage: Sends chat messages via Socket.IO and clears input.
Utility Functions:
black: Creates a black video track (used as a fallback).
silence: Creates a silent audio track (used as a fallback).
handleVideo, handleAudio, handleScreen, handleEndCall: Toggle video, audio, screen sharing, or end the call.
connect: Transitions from lobby to meeting room, initiating Socket.IO connection.
Rendering:
Lobby View: Displays username input and local video preview before joining.
Meeting View: Shows local video, remote videos, control buttons (video, audio, screen share, end call), and a toggleable chat modal with message history and input.
Key Features
WebRTC: Enables peer-to-peer video/audio streaming with STUN server for NAT traversal.
Socket.IO: Manages signaling for WebRTC and real-time chat.
UI: Uses Material UI for buttons, icons, and chat input, with a CSS module for styling.
Media Controls: Toggle video, audio, and screen sharing (if supported).
Chat: Real-time chat with unread message badges.
Lobby: Username input before joining the call.
Notes
The code uses addStream and onaddstream, which are deprecated in modern WebRTC. Consider updating to addTrack and ontrack for better compatibility.
Error handling is minimal (e.g., catch blocks log errors but don't inform the user).
Screen sharing is implemented but toggles the screen state without fully handling stream replacement.
The newMessages initial state of 3 is unusual and may be a placeholder or bug.
The black and silence functions are defined but not used in the provided code.
