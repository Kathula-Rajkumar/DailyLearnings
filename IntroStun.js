// Import React and required hooks from the React library
import React, { useRef, useState } from 'react';

// Import external CSS for styling the video component
import "../styles/videoComponent.css";

// Local server URL for signaling (used by socket.io)
const server_url = "http://localhost:8000";

// `connections` object will store peer-to-peer connections (WebRTC)
var connections = {};

// WebRTC peer connection configuration with STUN server
const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302" // Google's public STUN server
    }
  ]
};

// The main functional React component
export default function VideoMeetComponent() {

  // Socket reference for real-time signaling (WebSocket)
  const socketRef = useRef();

  // Reference to store the socket ID
  const socketIdRef = useRef();

  // Reference to the local user's video element
  const localVideoref = useRef();

  // Ref to store all remote video streams
  const videoRef = useRef([]);

  // State: Is video (webcam) available?
  const [videoAvailable, setVideoAvailable] = useState(true);

  // State: Is audio (microphone) available?
  const [audioAvailable, setAudioAvailable] = useState(true);

  // State: Stores individual remote video stream (if needed)
  const [video, setVideo] = useState([]);

  // State: Stores individual audio stream (if needed)
  const [audio, setAudio] = useState();

  // State: Stores screen sharing stream (if enabled)
  const [screen, setScreen] = useState();

  // State: Controls visibility of a modal (e.g., username prompt)
  const [showModal, setModal] = useState(true);

  // State: Checks if screen sharing is supported
  const [screenAvailable, setScreenAvailable] = useState();

  // State: Chat messages exchanged during the call
  const [messages, setMessages] = useState([]);

  // State: Current input message (from chat textbox)
  const [message, setMessage] = useState("");

  // State: Count of unread new messages
  const [newMessages, setNewMessages] = useState(3);

  // State: Controls if user needs to input a username before joining
  const [askForUsername, setAskForUsername] = useState(true);

  // State: The actual username entered by the user
  const [username, setUsername] = useState("");

  // State: List of video elements/streams currently being shown
  const [videos, setVideos] = useState([]);

  // JSX returned by the component
  return (
    <div>
      {/* Conditional rendering: If we are asking for the username */}
      {askForUsername === true ? (
        <div>
          {/* Display a heading prompting the user to enter their username */}
          <h2>Enter your username to join</h2>

          {/* Input field for the user to enter their name */}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // Update username state on input
          />
        </div>
      ) : (
        // If askForUsername is false, return an empty fragment (no UI yet)
        <></>
      )}
    </div>
  );
}
