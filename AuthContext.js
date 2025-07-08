

import axios from "axios"; // For making HTTP requests to the backend
import httpStatus from "http-status"; // To refer to status codes like 200 (OK), 201 (Created) by name
import { createContext, useContext, useState } from "react"; // React context and hooks
import { useNavigate } from "react-router-dom"; // To navigate between routes after login/register

// Create the AuthContext to hold and share authentication-related data and functions
export const AuthContext = createContext({});

// Create an axios instance to hit user-related backend APIs
const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1/user' // Backend URL for user APIs
});

// This component will wrap your app and provide authentication state + functions via Context
export const AuthProvider = ({ children }) => {
  // Try to access any default value already present in the context (not used much here, just init)
  const authContext = useContext(AuthContext);

  // This state holds user-related data that can be accessed by any child component
  const [userData, setUserData] = useState(authContext);

  // Router hook to programmatically navigate (e.g., redirect after login)
  const router = useNavigate();

  // Function to register a new user
  const handleRegister = async (name, username, password) => {
    try {
      // Make POST request to /register API
      let request = await client.post("/register", {
        name,
        username,
        password
      });

      // If the response status is 201 Created, return success message
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      // Let the component using this function handle the error
      throw err;
    }
  };

  // Function to log in a user
  const handleLogin = async (username, password) => {
    try {
      // Make POST request to /login API
      let request = await client.post("/login", {
        username,
        password
      });

      console.log(username, password);
      console.log(request.data);

      // If login is successful, store the token and navigate to /home
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token); // Store JWT token in browser
        router("/home"); // Redirect to home page
      }
    } catch (err) {
      throw err; // Pass error to component
    }
  };

  // Function to fetch user's video call history using stored token
  const getHistoryOfUser = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token") // Send token as query param
        }
      });
      return request.data; // Return data to caller
    } catch (err) {
      throw err;
    }
  };

  // Function to add a meeting to user's activity history
  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode
      });
      return request;
    } catch (e) {
      throw e;
    }
  };

  // Object containing all context values and functions
  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin
  };

  // Wrap children with AuthContext.Provider so all nested components can access `data`
  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};






// learnings 
Implemented React Context API to manage and share global authentication state.

Created a custom Axios instance for clean and reusable API calls.

Built modular functions for handleLogin and handleRegister with proper error handling.

Used localStorage to store JWT tokens securely and persist user sessions.

Integrated useNavigate() from React Router to handle post-login redirection.

Managed user activity (like video call history) via API methods (getHistoryOfUser, addToUserHistory).

Improved code readability using HTTP status constants from the http-status package.

Structured the context to ensure scalability and separation of concerns in the authentication flow.
