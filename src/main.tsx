import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import {Amplify} from "aws-amplify";
import outputs from "../amplify_outputs.json";
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {BrowserRouter} from 'react-router-dom';

Amplify.configure(outputs);

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <BrowserRouter>
                <App/>
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);
