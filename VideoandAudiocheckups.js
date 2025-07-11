// Import necessary React hooks and modules
import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client"; // For real-time communication (not yet used in this code)
import { Badge, IconButton, TextField, Button } from '@mui/material'; // UI components from Material UI

// Define your signaling server URL (used later with socket.io)
const server_url = "http://localhost:8000";

// Global object to store peer connections
var connections = {};

// WebRTC configuration for establishing peer-to-peer connections
const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302" // Google's public STUN server for NAT traversal
    }
  ]
};

export default function VideoMeetComponent() {
  // References to hold persistent values across renders
  const socketRef = useRef();           // Socket connection reference
  const socketIdRef = useRef();         // Store socket ID
  const localVideoref = useRef();       // Reference to local video <video> tag
  const videoRef = useRef([]);          // Array of remote video refs (for future multi-peer setup)

  // Local state management using useState
  const [videoAvailable, setVideoAvailable] = useState(true);   // Is webcam allowed
  const [audioAvailable, setAudioAvailable] = useState(true);   // Is microphone allowed
  const [video, setVideo] = useState([]);                       // Video constraints
  const [audio, setAudio] = useState();                         // Audio constraints
  const [screen, setScreen] = useState();                       // Screen sharing (not used here)
  const [showModal, setModal] = useState(true);                // UI modal toggle (not used here)
  const [screenAvailable, setScreenAvailable] = useState();     // Is screen sharing supported
  const [messages, setMessages] = useState([]);                 // Chat messages (not used yet)
  const [message, setMessage] = useState("");                   // Current message
  const [newMessages, setNewMessages] = useState(3);            // Notification badge
  const [askForUsername, setAskForUsername] = useState(true);   // Show lobby screen
  const [username, setUsername] = useState("");                 // Store user's name
  const [videos, setVideos] = useState([]);                     // Array of video streams (for multiple peers)

  // Function to ask for webcam/mic/screen permissions
  const getPermissions = async () => {
    try {
      // Request access to webcam
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);

      // Request access to microphone
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPermission);

      // Check if screen sharing is supported
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // If either webcam or mic is available, get combined stream
      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable
        });

        // Store stream globally and attach to local video element
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error); // Log any permission or stream errors
    }
  };

  // On component mount, request media permissions
  useEffect(() => {
    getPermissions();
  }, []);

  // Callback for successful getUserMedia (currently empty)
  let getUserMediaSuccess = (stream) => {
    // Placeholder for future logic (like setting remote video stream)
  };

  // Function to get media stream when video/audio state changes
  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess) // Optional callback
        .then((stream) => {
          // Can be used to attach to video element
        })
        .catch((e) => console.log(e)); // Handle permission or device errors
    } else {
      // Stop all local media tracks if not available
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch {
        // Silent catch
      }
    }
  };

  // Watch for changes in audio or video state and request stream again
  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  // Assigns current media settings to state and prepares for connection
  let getMedia = () => {
    setVideo(videoAvailable);           // Set video constraints
    setAudio(setAudioAvailable);        // ❌ This is wrong — should be: setAudio(audioAvailable)
    // connectToSocketServer();         // Placeholder for future socket logic
  };

  // Triggered when user clicks "Connect" button
  const connect = () => {
    getMedia();                         // Set current media options
    setAskForUsername(false);          // Hide the lobby screen

    // Connect to server (if enabled)
    // socketRef.current = io(server_url);
    // socketRef.current.emit("join-call", { username });
  };

  // Render UI
  return (
    <div>
      {/* Show lobby UI if askForUsername is true */}
      {askForUsername === true ? 
        <div>
          <h2>Enter into Lobby</h2>
          {/* Username input */}
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            variant="outlined"
          />

          {/* Connect button */}
          <Button variant="contained" onClick={connect}>Connect</Button>

          {/* Local webcam preview */}
          <div>
            <video
              ref={localVideoref}
              autoPlay
              muted
              playsInline
              style={{ width: '900px' }}
            />
          </div>
        </div>
        : <></> // Empty if lobby is hidden
      }
    </div>
  );
}



long story short

1.Getting webcam and mic permissions.

2.Checking screen sharing support.

3.Showing a lobby (username input + "Connect" button).

4.Previewing your own webcam feed.
