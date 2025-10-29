import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { PageHeader } from '@cloudpos/layout';
import type {
  Employee,
  Department,
  EmployeePosition,
  EmployeeRole,
  PositionLevel,
  PerformanceReview,
  Timesheet,
  LeaveRequest,
  EmployeeSchedule,
  WorkDay,
  DayOfWeek
} from '@cloudpos/types';

interface EmployeeManagementPageProps {}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data
const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Sales',
    description: 'Customer sales and service',
    managerId: '1',
    costCenter: 'CC001',
    budget: 120000,
    employeeCount: 8,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Operations',
    description: 'Store operations and inventory',
    managerId: '2',
    costCenter: 'CC002',
    budget: 95000,
    employeeCount: 6,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Administration',
    description: 'Management and HR',
    managerId: '3',
    costCenter: 'CC003',
    budget: 85000,
    employeeCount: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockPositions: EmployeePosition[] = [
  { id: '1', title: 'Store Manager', level: 'manager' as PositionLevel, departmentId: '3', baseSalary: 65000, isActive: true },
  { id: '2', title: 'Sales Associate', level: 'entry' as PositionLevel, departmentId: '1', hourlyRate: 15, isActive: true },
  { id: '3', title: 'Cashier', level: 'entry' as PositionLevel, departmentId: '1', hourlyRate: 14, isActive: true },
  { id: '4', title: 'Supervisor', level: 'senior' as PositionLevel, departmentId: '1', baseSalary: 45000, isActive: true },
  { id: '5', title: 'Stock Clerk', level: 'entry' as PositionLevel, departmentId: '2', hourlyRate: 13, isActive: true }
];

const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@cloudpos.com',
    phone: '+1-555-0101',
    position: mockPositions[0],
    department: mockDepartments[2],
    role: 'manager' as EmployeeRole,
    permissions: [],
    salary: 65000,
    hireDate: '2023-01-15',
    isActive: true,
    performanceRating: 4.8,
    notes: 'Excellent leadership skills and customer service',
    storeId: 'store-001',
    profileImage: '',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@cloudpos.com',
    phone: '+1-555-0102',
    position: mockPositions[1],
    department: mockDepartments[0],
    role: 'sales_associate' as EmployeeRole,
    permissions: [],
    hourlyRate: 15,
    hireDate: '2023-03-10',
    isActive: true,
    performanceRating: 4.5,
    managerId: '1',
    notes: 'Strong sales performance and product knowledge',
    storeId: 'store-001',
    profileImage: '',
    createdAt: '2023-03-10T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@cloudpos.com',
    phone: '+1-555-0103',
    position: mockPositions[2],
    department: mockDepartments[0],
    role: 'cashier' as EmployeeRole,
    permissions: [],
    hourlyRate: 14,
    hireDate: '2023-06-01',
    isActive: true,
    performanceRating: 4.3,
    managerId: '1',
    notes: 'Reliable and efficient with transactions',
    storeId: 'store-001',
    profileImage: '',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@cloudpos.com',
    phone: '+1-555-0104',
    position: mockPositions[3],
    department: mockDepartments[0],
    role: 'supervisor' as EmployeeRole,
    permissions: [],
    salary: 45000,
    hireDate: '2023-02-20',
    isActive: true,
    performanceRating: 4.6,
    managerId: '1',
    notes: 'Great team leader and problem solver',
    storeId: 'store-001',
    profileImage: '',
    createdAt: '2023-02-20T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'Lisa',
    lastName: 'Wang',
    email: 'lisa.wang@cloudpos.com',
    phone: '+1-555-0105',
    position: mockPositions[4],
    department: mockDepartments[1],
    role: 'stock_clerk' as EmployeeRole,
    permissions: [],
    hourlyRate: 13,
    hireDate: '2023-08-15',
    isActive: true,
    performanceRating: 4.2,
    managerId: '2',
    notes: 'Detail-oriented and organized inventory management',
    storeId: 'store-001',
    profileImage: '',
    createdAt: '2023-08-15T00:00:00Z',
    updatedAt: '2024-10-29T00:00:00Z'
  }
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeId: '2',
    employee: mockEmployees[1],
    type: 'vacation',
    startDate: '2024-11-15',
    endDate: '2024-11-17',
    days: 3,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: '2024-10-28T00:00:00Z',
    updatedAt: '2024-10-28T00:00:00Z'
  },
  {
    id: '2',
    employeeId: '3',
    employee: mockEmployees[2],
    type: 'sick',
    startDate: '2024-10-25',
    endDate: '2024-10-25',
    days: 1,
    reason: 'Flu symptoms',
    status: 'approved',
    approverId: '1',
    approvedAt: '2024-10-24T00:00:00Z',
    createdAt: '2024-10-24T00:00:00Z',
    updatedAt: '2024-10-24T00:00:00Z'
  }
];

export default function EmployeeManagementPage({}: EmployeeManagementPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const searchMatch = searchTerm === '' || 
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const departmentMatch = selectedDepartment === '' || employee.department.id === selectedDepartment;
      const roleMatch = selectedRole === '' || employee.role === selectedRole;
      
      return searchMatch && departmentMatch && roleMatch;
    });
  }, [employees, searchTerm, selectedDepartment, selectedRole]);

  // Calculate department statistics
  const departmentStats = useMemo(() => {
    return mockDepartments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department.id === dept.id);
      const avgPerformance = deptEmployees.reduce((sum, emp) => sum + (emp.performanceRating || 0), 0) / deptEmployees.length || 0;
      const totalSalary = deptEmployees.reduce((sum, emp) => sum + (emp.salary || (emp.hourlyRate || 0) * 2080), 0);
      
      return {
        ...dept,
        actualEmployeeCount: deptEmployees.length,
        avgPerformance: avgPerformance,
        totalSalary: totalSalary
      };
    });
  }, [employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: EmployeeRole) => {
    const colors = {
      admin: 'error',
      manager: 'primary',
      supervisor: 'warning',
      cashier: 'info',
      stock_clerk: 'secondary',
      sales_associate: 'success',
      customer_service: 'default'
    };
    return colors[role] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      active: 'success',
      inactive: 'default'
    };
    return colors[status] || 'default';
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeDialogOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  const handleCloseEmployeeDialog = () => {
    setIsEmployeeDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  const handleToggleEmployeeStatus = (employeeId: string) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, isActive: !emp.isActive } : emp
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Employee Management" 
        subtitle="Manage staff, departments, schedules, and performance"
      />

      {/* Overview Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {employees.filter(emp => emp.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employees.filter(emp => !emp.isActive).length} inactive
                </Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Departments
                </Typography>
                <Typography variant="h4">
                  {mockDepartments.filter(dept => dept.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active departments
                </Typography>
              </Box>
              <BusinessIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Avg Performance
                </Typography>
                <Typography variant="h4" color="success.main">
                  {(employees.reduce((sum, emp) => sum + (emp.performanceRating || 0), 0) / employees.length).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of 5.0
                </Typography>
              </Box>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Pending Requests
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {mockLeaveRequests.filter(req => req.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leave requests
                </Typography>
              </Box>
              <TimeIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Department"
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value="">All Departments</MenuItem>
            {mockDepartments.map(dept => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            label="Role"
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
            <MenuItem value="cashier">Cashier</MenuItem>
            <MenuItem value="sales_associate">Sales Associate</MenuItem>
            <MenuItem value="stock_clerk">Stock Clerk</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEmployee}
        >
          Add Employee
        </Button>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Employee Directory" />
            <Tab label="Departments" />
            <Tab label="Leave Requests" />
            <Tab label="Performance" />
          </Tabs>
        </Box>

        {/* Employee Directory Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} sx={{ position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Chip
                          label={employee.role}
                          size="small"
                          color={getRoleColor(employee.role) as any}
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.employeeId} • {employee.position.title}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.department.name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                      
                      {employee.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {employee.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {employee.performanceRating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="body2">
                              {employee.performanceRating}/5.0
                            </Typography>
                          </Box>
                        )}
                        
                        {(employee.salary || employee.hourlyRate) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2">
                              {employee.salary 
                                ? formatCurrency(employee.salary)
                                : `${formatCurrency(employee.hourlyRate!)}/hr`
                              }
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={employee.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={employee.isActive ? 'success' : 'default'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Since {formatDate(employee.hireDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewEmployee(employee)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Employee">
                        <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Employee">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={employee.isActive}
                          onChange={() => handleToggleEmployeeStatus(employee.id)}
                          size="small"
                        />
                      }
                      label="Active"
                      sx={{ m: 0 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          {filteredEmployees.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No employees found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search criteria or add a new employee.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Departments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2 }}>
            {departmentStats.map((dept) => (
              <Card key={dept.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{dept.name}</Typography>
                    <Chip
                      label={dept.isActive ? 'Active' : 'Inactive'}
                      color={dept.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  {dept.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dept.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Employees</Typography>
                      <Typography variant="h6">{dept.actualEmployeeCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Budget</Typography>
                      <Typography variant="h6">{formatCurrency(dept.budget || 0)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Avg Performance</Typography>
                      <Typography variant="h6">{dept.avgPerformance.toFixed(1)}/5.0</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Salary</Typography>
                      <Typography variant="h6">{formatCurrency(dept.totalSalary)}</Typography>
                    </Box>
                  </Box>
                  
                  {dept.costCenter && (
                    <Typography variant="caption" color="text.secondary">
                      Cost Center: {dept.costCenter}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Leave Requests Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            {mockLeaveRequests.map((request) => (
              <Card key={request.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {request.employee?.firstName[0]}{request.employee?.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {request.employee?.firstName} {request.employee?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.employee?.position.title} • {request.employee?.department.name}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status) as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Type</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {request.type.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Duration</Typography>
                      <Typography variant="body1">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Days</Typography>
                      <Typography variant="body1">{request.days} day(s)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Requested</Typography>
                      <Typography variant="body1">{formatDate(request.createdAt)}</Typography>
                    </Box>
                  </Box>
                  
                  {request.reason && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Reason</Typography>
                      <Typography variant="body1">{request.reason}</Typography>
                    </Box>
                  )}
                  
                  {request.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="success" size="small">
                        Approve
                      </Button>
                      <Button variant="outlined" color="error" size="small">
                        Reject
                      </Button>
                    </Box>
                  )}
                  
                  {request.approvedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(request.approvedAt)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Employee Performance Overview
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.position.title}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Performance Rating</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {employee.performanceRating || 'N/A'}/5.0
                        </Typography>
                      </Box>
                      
                      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                        <Box 
                          sx={{ 
                            width: `${(employee.performanceRating || 0) * 20}%`, 
                            bgcolor: 'success.main', 
                            height: '100%', 
                            borderRadius: 1,
                            transition: 'width 0.3s'
                          }} 
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Hired: {formatDate(employee.hireDate)}
                      </Typography>
                      <Button size="small" variant="outlined">
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </TabPanel>
      </Card>

      {/* Employee Details Dialog */}
      <Dialog
        open={Boolean(viewingEmployee)}
        onClose={() => setViewingEmployee(null)}
        maxWidth="md"
        fullWidth
      >
        {viewingEmployee && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60 }}>
                  {viewingEmployee.firstName[0]}{viewingEmployee.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewingEmployee.position.title} • {viewingEmployee.department.name}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
                  <Typography variant="body2">Email: {viewingEmployee.email}</Typography>
                  <Typography variant="body2">Phone: {viewingEmployee.phone || 'N/A'}</Typography>
                  <Typography variant="body2">Employee ID: {viewingEmployee.employeeId}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Employment Details</Typography>
                  <Typography variant="body2">Hire Date: {formatDate(viewingEmployee.hireDate)}</Typography>
                  <Typography variant="body2">Role: {viewingEmployee.role}</Typography>
                  <Typography variant="body2">Status: {viewingEmployee.isActive ? 'Active' : 'Inactive'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Compensation</Typography>
                  <Typography variant="body2">
                    {viewingEmployee.salary 
                      ? `Salary: ${formatCurrency(viewingEmployee.salary)}`
                      : `Hourly Rate: ${formatCurrency(viewingEmployee.hourlyRate || 0)}/hr`
                    }
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Performance</Typography>
                  <Typography variant="body2">
                    Rating: {viewingEmployee.performanceRating || 'N/A'}/5.0
                  </Typography>
                </Box>
              </Box>
              {viewingEmployee.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{viewingEmployee.notes}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewingEmployee(null)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setViewingEmployee(null);
                  handleEditEmployee(viewingEmployee);
                }}
              >
                Edit Employee
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Employee Dialog */}
      <Dialog
        open={isEmployeeDialogOpen}
        onClose={handleCloseEmployeeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Employee form would be implemented here with all necessary fields
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmployeeDialog}>Cancel</Button>
          <Button variant="contained">
            {editingEmployee ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}