// src/components/Layout/MainLayout.jsx
import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Description,
  Settings,
  ExitToApp,
  Notifications,
  LightMode,
  DarkMode,
  Solar,
  Build,
  Analytics,
  AttachMoney
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';

const drawerWidth = 280;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <Dashboard />, 
    path: '/admin/dashboard',
    color: '#f0c14b'
  },
  { 
    text: 'Clientes', 
    icon: <People />, 
    path: '/admin/clients',
    color: '#4CAF50'
  },
  { 
    text: 'Orçamentos Solar', 
    icon: <Solar />, 
    path: '/admin/budgets/solar',
    color: '#FF9800'
  },
  { 
    text: 'Orçamentos Serviços', 
    icon: <Build />, 
    path: '/admin/budgets/services',
    color: '#2196F3'
  },
  { 
    text: 'Propostas', 
    icon: <Description />, 
    path: '/admin/proposals',
    color: '#9C27B0'
  },
  { 
    text: 'Financeiro', 
    icon: <AttachMoney />, 
    path: '/admin/financial',
    color: '#4CAF50'
  },
  { 
    text: 'Relatórios', 
    icon: <Analytics />, 
    path: '/admin/reports',
    color: '#FF5722'
  },
  { 
    text: 'Configurações', 
    icon: <Settings />, 
    path: '/admin/settings',
    color: '#607D8B'
  }
];

export default function MainLayout({ children, title = 'LuminaSol' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleCloseNotificationMenu = () => {
    setNotificationAnchor(null);
  };

  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: '#1a1a1a' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            width: 120, 
            height: 120, 
            margin: '0 auto',
            mb: 2,
            background: 'linear-gradient(135deg, #f0c14b 0%, #ff9800 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(240, 193, 75, 0.4)'
          }}>
            <Solar sx={{ fontSize: 60, color: 'white' }} />
          </Box>
        </motion.div>
        <Typography variant="h5" sx={{ color: '#f0c14b', fontWeight: 'bold' }}>
          LuminaSol
        </Typography>
        <Typography variant="caption" sx={{ color: '#999' }}>
          Sistema de Orçamentos
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: '#333' }} />
      <List sx={{ px: 2 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItem
              button
              component={Link}
              href={item.path}
              selected={router.pathname === item.path}
              sx={{
                mb: 1,
                borderRadius: 2,
                color: '#fff',
                '&.Mui-selected': {
                  backgroundColor: item.color + '20',
                  color: item.color,
                  '&:hover': {
                    backgroundColor: item.color + '30',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {React.cloneElement(item.icon, { sx: { color: item.color } })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: router.pathname === item.path ? 600 : 400
                }}
              />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  sx={{ 
                    backgroundColor: item.color,
                    color: 'white',
                    height: 20,
                    fontSize: 11
                  }}
                />
              )}
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Alternar tema">
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notificações">
              <IconButton onClick={handleNotificationMenu}>
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Perfil">
              <IconButton onClick={handleProfileMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: '#f0c14b' }}>A</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleCloseNotificationMenu}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notificações</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleCloseNotificationMenu}>
          <Box>
            <Typography variant="subtitle2">Novo orçamento aceito!</Typography>
            <Typography variant="caption" color="text.secondary">
              Cliente João Silva aceitou o orçamento #ORC-202402-0123
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleCloseNotificationMenu}>
          <Box>
            <Typography variant="subtitle2">Proposta visualizada</Typography>
            <Typography variant="caption" color="text.secondary">
              Maria Santos visualizou a proposta solar
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseProfileMenu}
      >
        <MenuItem onClick={handleCloseProfileMenu}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Meu Perfil
        </MenuItem>
        <MenuItem onClick={handleCloseProfileMenu}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => router.push('/logout')}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#1a1a1a'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#1a1a1a',
              borderRight: 'none'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </Box>
    </Box>
  );
}
