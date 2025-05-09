import React, { useState } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Typography, Toolbar, AppBar, IconButton, CssBaseline
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EventIcon from '@mui/icons-material/Event';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

import EventPanel from './EventPanel';
import RoomPanel from './RoomPanel';

const drawerWidth = 240;

type PanelType = 'events' | 'rooms';

const AdministrationWithSidebar: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<PanelType>('rooms');

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handlePanelChange = (panel: PanelType) => {
        setActivePanel(panel);
        if (mobileOpen) { // Закрываем мобильный Drawer при выборе
            setMobileOpen(false);
        }
    };

    const drawerContent = (
        <div>
            <Toolbar /> {/* Для отступа под AppBar */}
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={activePanel === 'rooms'}
                        onClick={() => handlePanelChange('rooms')}
                    >
                        <ListItemIcon>
                            <MeetingRoomIcon />
                        </ListItemIcon>
                        <ListItemText primary="Кімнати" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={activePanel === 'events'}
                        onClick={() => handlePanelChange('events')}
                    >
                        <ListItemIcon>
                            <EventIcon />
                        </ListItemIcon>
                        <ListItemText primary="Події" />
                    </ListItemButton>
                </ListItem>

            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        Адмінпанель
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="admin sections"
            >
                {/* Мобильный Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Стационарный Drawer для больших экранов */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar /> {/* Для отступа под AppBar */}
                {activePanel === 'events' && <EventPanel />}
                {activePanel === 'rooms' && <RoomPanel />}
            </Box>
        </Box>
    );
};

export default AdministrationWithSidebar;