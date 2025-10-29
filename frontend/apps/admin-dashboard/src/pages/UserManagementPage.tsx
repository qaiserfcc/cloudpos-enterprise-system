import React, { useState } from 'react';
import {
  Box,
  Paper,
  Chip,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import { User, UserRole, UserStatus } from '@cloudpos/types';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@cloudpos.com',
    firstName: 'John',
    lastName: 'Admin',
    role: 'admin',
    status: 'active',
    isActive: true,
    permissions: ['all'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastLoginAt: '2024-01-20T09:30:00Z',
  },
  {
    id: '2',
    email: 'manager@cloudpos.com',
    firstName: 'Sarah',
    lastName: 'Manager',
    role: 'manager',
    status: 'active',
    isActive: true,
    permissions: ['sales', 'inventory'],
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    lastLoginAt: '2024-01-19T14:20:00Z',
  },
  {
    id: '3',
    email: 'cashier@cloudpos.com',
    firstName: 'Mike',
    lastName: 'Cashier',
    role: 'cashier',
    status: 'active',
    isActive: true,
    permissions: ['sales'],
    createdAt: '2024-01-17T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z',
    lastLoginAt: '2024-01-20T08:00:00Z',
  },
  {
    id: '4',
    email: 'inactive@cloudpos.com',
    firstName: 'Jane',
    lastName: 'Inactive',
    role: 'cashier',
    status: 'inactive',
    isActive: false,
    permissions: ['sales'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    lastLoginAt: null,
  },
];

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

const initialFormData: UserFormData = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'cashier',
  status: 'active',
};

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Role chip colors
  const getRoleColor = (role: UserRole): 'error' | 'warning' | 'info' | 'default' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'cashier':
        return 'info';
      default:
        return 'default';
    }
  };

  // Status chip colors
  const getStatusColor = (status: UserStatus): 'success' | 'default' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    } else if (users.some(user => user.email === formData.email && user.id !== editingUser?.id)) {
      errors.email = 'Email already exists';
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Event handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    setUsers(prev => prev.map(u => 
      u.id === user.id 
        ? { ...u, status: newStatus, isActive: newStatus === 'active', updatedAt: new Date().toISOString() }
        : u
    ));
  };

  const handleSendEmail = (user: User) => {
    // In real implementation, this would trigger an email service
    console.log('Sending email to:', user.email);
    // Show success notification
  };

  const handleDeleteUser = (user: User) => {
    // In real implementation, show confirmation dialog first
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleSaveUser = () => {
    if (!validateForm()) return;

    if (editingUser) {
      // Update existing user
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id
          ? {
              ...user,
              ...formData,
              isActive: formData.status === 'active',
              updatedAt: new Date().toISOString(),
            }
          : user
      ));
    } else {
      // Create new user
      const newUser: User = {
        id: (users.length + 1).toString(),
        ...formData,
        isActive: formData.status === 'active',
        permissions: formData.role === 'admin' ? ['all'] : ['sales'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      setUsers(prev => [...prev, newUser]);
    }

    setOpenDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Get paginated users
  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <PageHeader 
        title="User Management" 
        subtitle="Manage user accounts, roles, and permissions"
        actions={
          <MuiButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
          >
            Add User
          </MuiButton>
        }
      />

      <Box sx={{ p: 3 }}>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLoginAt || null)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === 'active' ? <BlockIcon /> : <ActivateIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email">
                          <IconButton 
                            size="small" 
                            onClick={() => handleSendEmail(user)}
                          >
                            <EmailIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* User Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              >
                <MenuItem value="cashier">Cashier</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserStatus }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            {Object.keys(formErrors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before saving.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDialog}>
            Cancel
          </MuiButton>
          <MuiButton 
            variant="contained" 
            onClick={handleSaveUser}
          >
            {editingUser ? 'Update User' : 'Create User'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagementPage;