// Importing required React and Material UI components
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext'; // Import your custom authentication context
import { Snackbar } from '@mui/material'; // Used to show temporary messages

// Create a default MUI theme (can be customized)
const defaultTheme = createTheme();

// Main component
export default function Authentication() {
    // React state hooks for managing form fields
    const [username, setUsername] = React.useState(); // for username input
    const [password, setPassword] = React.useState(); // for password input
    const [name, setName] = React.useState();         // for full name input (sign up only)
    const [error, setError] = React.useState();       // for error messages
    const [message, setMessage] = React.useState();   // for success message (snackbar)

    const [formState, setFormState] = React.useState(0); // 0 for login, 1 for signup

    const [open, setOpen] = React.useState(false); // control visibility of Snackbar

    // Using AuthContext to get login and register methods
    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    // Function to handle login/register depending on formState
    let handleAuth = async () => {
        try {
            if (formState === 0) {
                // Login user
                let result = await handleLogin(username, password);
            }
            if (formState === 1) {
                // Register user
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setPassword("");
                setFormState(0); // switch to login mode
                setMessage(result); // show success message
                setOpen(true);      // open Snackbar
                setError("");       // clear any previous errors
            }
        } catch (err) {
            console.log(err);
            let message = (err.response?.data?.message || "Something went wrong");
            setError(message); // set error message
        }
    };

    return (
        // Wrap the whole UI in a ThemeProvider to use MUI's theme system
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline /> {/* Normalize browser styling */}

                {/* Left side background image */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Right side form container */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* Lock icon */}
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        {/* Toggle buttons to switch between Sign In and Sign Up */}
                        <div>
                            <Button
                                variant={formState === 0 ? "contained" : ""}
                                onClick={() => { setFormState(0) }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={formState === 1 ? "contained" : ""}
                                onClick={() => { setFormState(1) }}
                            >
                                Sign Up
                            </Button>
                        </div>

                        {/* Form */}
                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            {/* Show full name field only in signup */}
                            {formState === 1 ? (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Full Name"
                                    name="username"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                />
                            ) : null}

                            {/* Username input */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            {/* Password input */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                id="password"
                            />

                            {/* Show error if exists */}
                            <p style={{ color: "red" }}>{error}</p>

                            {/* Submit button */}
                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Login " : "Register"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Snackbar to show success message after registration */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
            />
        </ThemeProvider>
    );
}

// Key points

1.useState to manage form input values and UI state.

2.useContext(AuthContext) to access login/register logic.

3.Material UI for styled components and responsive layout.

4.Snackbar to display success messages.

5.Grid system to split screen into image + form layout.

6.Conditional rendering based on form mode (sign in vs sign up).
