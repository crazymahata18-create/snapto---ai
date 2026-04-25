/**
 * SnapTo AI — Mock Data Generator
 * Generates realistic employee, camera, alert, and analytics data
 */

const employees = [
  { id: 'EMP-001', name: 'Rahul Kumar', role: 'Senior Developer', department: 'Engineering', initials: 'RK', color: '#00e5ff', status: 'working', location: 'Floor A - Desk 12', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-002', name: 'Priya Sharma', role: 'HR Manager', department: 'Human Resources', initials: 'PS', color: '#00ff9d', status: 'working', location: 'Floor A - Desk 3', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-003', name: 'Amit Mishra', role: 'Sales Lead', department: 'Sales', initials: 'AM', color: '#ffb800', status: 'break', location: 'Cafeteria', lastSeen: null, breakMinutes: 12 },
  { id: 'EMP-004', name: 'Sneha Bose', role: 'Accountant', department: 'Finance', initials: 'SB', color: '#ff2d55', status: 'absent', location: 'N/A', lastSeen: '09:15:00', breakMinutes: 0 },
  { id: 'EMP-005', name: 'Vikram Rao', role: 'Security Lead', department: 'Security', initials: 'VR', color: '#00e5ff', status: 'working', location: 'Floor B - Security Desk', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-006', name: 'Deepika Nair', role: 'UX Designer', department: 'Design', initials: 'DN', color: '#e040fb', status: 'working', location: 'Floor A - Desk 8', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-007', name: 'Arjun Patel', role: 'Backend Engineer', department: 'Engineering', initials: 'AP', color: '#00e5ff', status: 'working', location: 'Floor A - Desk 14', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-008', name: 'Meera Joshi', role: 'QA Engineer', department: 'Engineering', initials: 'MJ', color: '#7c4dff', status: 'idle', location: 'Floor A - Desk 6', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-009', name: 'Karthik Iyer', role: 'DevOps Engineer', department: 'Engineering', initials: 'KI', color: '#00bcd4', status: 'working', location: 'Floor B - Server Room', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-010', name: 'Anjali Gupta', role: 'Marketing Manager', department: 'Marketing', initials: 'AG', color: '#ff6e40', status: 'working', location: 'Floor A - Desk 1', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-011', name: 'Rohan Verma', role: 'Frontend Developer', department: 'Engineering', initials: 'RV', color: '#00e5ff', status: 'working', location: 'Floor A - Desk 15', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-012', name: 'Sanjay Mehta', role: 'Team Lead', department: 'Engineering', initials: 'SM', color: '#ffb800', status: 'working', location: 'Floor A - Cabin 2', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-013', name: 'Kavitha Reddy', role: 'Data Analyst', department: 'Analytics', initials: 'KR', color: '#00ff9d', status: 'break', location: 'Cafeteria', lastSeen: null, breakMinutes: 8 },
  { id: 'EMP-014', name: 'Nikhil Singh', role: 'Product Manager', department: 'Product', initials: 'NS', color: '#448aff', status: 'working', location: 'Floor B - Meeting Room 1', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-015', name: 'Ritu Agarwal', role: 'Content Writer', department: 'Marketing', initials: 'RA', color: '#ff4081', status: 'working', location: 'Floor A - Desk 5', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-016', name: 'Suresh Babu', role: 'Office Admin', department: 'Operations', initials: 'SU', color: '#ffb800', status: 'working', location: 'Floor A - Reception', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-017', name: 'Pooja Menon', role: 'ML Engineer', department: 'AI Lab', initials: 'PM', color: '#e040fb', status: 'working', location: 'Floor B - AI Lab', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-018', name: 'Manoj Tiwari', role: 'Network Admin', department: 'IT', initials: 'MT', color: '#00bcd4', status: 'idle', location: 'Floor B - Server Room', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-019', name: 'Divya Pillai', role: 'Finance Director', department: 'Finance', initials: 'DP', color: '#00ff9d', status: 'working', location: 'Floor B - Cabin 5', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-020', name: 'Rakesh Pandey', role: 'Intern', department: 'Engineering', initials: 'RP', color: '#ff6e40', status: 'working', location: 'Floor A - Desk 20', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-021', name: 'Aisha Khan', role: 'Legal Counsel', department: 'Legal', initials: 'AK', color: '#7c4dff', status: 'absent', location: 'N/A', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-022', name: 'Venkat Raman', role: 'Database Admin', department: 'Engineering', initials: 'VE', color: '#00e5ff', status: 'working', location: 'Floor B - Desk 2', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-023', name: 'Lakshmi Narayanan', role: 'Business Analyst', department: 'Strategy', initials: 'LN', color: '#ffb800', status: 'working', location: 'Floor A - Desk 9', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-024', name: 'Gaurav Chopra', role: 'Video Editor', department: 'Marketing', initials: 'GC', color: '#ff4081', status: 'break', location: 'Terrace', lastSeen: null, breakMinutes: 15 },
  { id: 'EMP-025', name: 'Tanvi Shah', role: 'Graphic Designer', department: 'Design', initials: 'TS', color: '#e040fb', status: 'working', location: 'Floor A - Desk 7', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-026', name: 'Harsh Vardhan', role: 'Security Guard', department: 'Security', initials: 'HV', color: '#00bcd4', status: 'working', location: 'Main Gate', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-027', name: 'Nisha Rawat', role: 'Recruiter', department: 'Human Resources', initials: 'NR', color: '#00ff9d', status: 'working', location: 'Floor A - Desk 4', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-028', name: 'Ashwin Desai', role: 'Systems Architect', department: 'Engineering', initials: 'AD', color: '#448aff', status: 'working', location: 'Floor B - Desk 1', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-029', name: 'Pallavi Shetty', role: 'Customer Support', department: 'Support', initials: 'PA', color: '#ff6e40', status: 'working', location: 'Floor A - Desk 18', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-030', name: 'Rajesh Kumar', role: 'CFO', department: 'Finance', initials: 'RJ', color: '#ffb800', status: 'working', location: 'Floor B - Cabin 6', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-031', name: 'Swathi Devi', role: 'Research Intern', department: 'AI Lab', initials: 'SD', color: '#e040fb', status: 'idle', location: 'Floor B - AI Lab', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-032', name: 'Arun Krishnan', role: 'Cloud Engineer', department: 'Engineering', initials: 'AK', color: '#00e5ff', status: 'working', location: 'Floor B - Desk 3', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-033', name: 'Bhavya Jain', role: 'Office Manager', department: 'Operations', initials: 'BJ', color: '#00ff9d', status: 'working', location: 'Floor A - Reception', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-034', name: 'Naveen Kumar', role: 'Security Guard', department: 'Security', initials: 'NK', color: '#00bcd4', status: 'working', location: 'Parking Gate', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-035', name: 'Ishita Banerjee', role: 'Social Media Manager', department: 'Marketing', initials: 'IB', color: '#ff4081', status: 'working', location: 'Floor A - Desk 11', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-036', name: 'Vishal Saxena', role: 'Compliance Officer', department: 'Legal', initials: 'VS', color: '#7c4dff', status: 'working', location: 'Floor B - Cabin 3', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-037', name: 'Snehal Patil', role: 'Junior Developer', department: 'Engineering', initials: 'SP', color: '#00e5ff', status: 'break', location: 'Cafeteria', lastSeen: null, breakMinutes: 5 },
  { id: 'EMP-038', name: 'Farhan Ahmed', role: 'Sales Executive', department: 'Sales', initials: 'FA', color: '#ffb800', status: 'working', location: 'Floor A - Desk 16', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-039', name: 'Chitra Ramesh', role: 'Training Manager', department: 'Human Resources', initials: 'CR', color: '#00ff9d', status: 'working', location: 'Floor B - Training Room', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-040', name: 'Aniket Joshi', role: 'AI Research Lead', department: 'AI Lab', initials: 'AJ', color: '#e040fb', status: 'working', location: 'Floor B - AI Lab', lastSeen: null, breakMinutes: 0 },
  { id: 'EMP-041', name: 'Sunita Devi', role: 'Cleaning Staff', department: 'Operations', initials: 'SN', color: '#ff6e40', status: 'working', location: 'Floor A - Common Area', lastSeen: null, breakMinutes: 0 },
];

const cameras = [
  { id: 'CAM-01', label: 'CAM-01 // LOBBY', location: 'Main Entrance Lobby', zone: 'A', status: 'active', resolution: '1080p', fps: 30 },
  { id: 'CAM-02', label: 'CAM-02 // FLOOR A', location: 'Floor A Open Office', zone: 'A', status: 'active', resolution: '1080p', fps: 30 },
  { id: 'CAM-03', label: 'CAM-03 // RESTRICTED', location: 'Server Room Entrance', zone: 'B', status: 'active', resolution: '4K', fps: 30 },
  { id: 'CAM-04', label: 'CAM-04 // EXIT', location: 'Main Exit Gate', zone: 'A', status: 'active', resolution: '1080p', fps: 30 },
  { id: 'CAM-05', label: 'CAM-05 // FLOOR B', location: 'Floor B Open Office', zone: 'B', status: 'active', resolution: '1080p', fps: 30 },
  { id: 'CAM-06', label: 'CAM-06 // CAFETERIA', location: 'Employee Cafeteria', zone: 'A', status: 'active', resolution: '720p', fps: 24 },
  { id: 'CAM-07', label: 'CAM-07 // PARKING', location: 'Parking Lot', zone: 'EXT', status: 'active', resolution: '1080p', fps: 24 },
  { id: 'CAM-08', label: 'CAM-08 // AI LAB', location: 'AI Research Lab', zone: 'B', status: 'active', resolution: '4K', fps: 30 },
  { id: 'CAM-09', label: 'CAM-09 // MEETING-1', location: 'Meeting Room 1', zone: 'B', status: 'active', resolution: '720p', fps: 24 },
  { id: 'CAM-10', label: 'CAM-10 // TERRACE', location: 'Terrace Area', zone: 'EXT', status: 'active', resolution: '1080p', fps: 24 },
  { id: 'CAM-11', label: 'CAM-11 // STAIRWELL', location: 'Main Stairwell', zone: 'A', status: 'active', resolution: '720p', fps: 24 },
  { id: 'CAM-12', label: 'CAM-12 // RECEPTION', location: 'Front Reception', zone: 'A', status: 'active', resolution: '1080p', fps: 30 },
];

const alertTemplates = [
  { type: 'unknown_face', severity: 'danger', msg: '⚠ Unknown face detected', zones: ['B', 'A'] },
  { type: 'idle', severity: 'warn', msg: 'Extended idle detected', zones: ['A', 'B'] },
  { type: 'restricted_zone', severity: 'danger', msg: '⚠ Unauthorized access attempt', zones: ['B'] },
  { type: 'argument', severity: 'warn', msg: 'Heated argument detected', zones: ['A', 'B'] },
  { type: 'safety', severity: 'danger', msg: '⚠ Safety protocol violation', zones: ['B', 'EXT'] },
  { type: 'attendance', severity: 'ok', msg: 'Attendance report generated', zones: ['SYSTEM'] },
  { type: 'face_match', severity: 'ok', msg: 'Face verified successfully', zones: ['A', 'B'] },
  { type: 'break_over', severity: 'ok', msg: 'Break ended — employee returned', zones: ['A'] },
  { type: 'unusual_gathering', severity: 'warn', msg: 'Unusual gathering detected', zones: ['A', 'B', 'EXT'] },
  { type: 'late_arrival', severity: 'warn', msg: 'Late arrival detected', zones: ['A'] },
];

const mockUsers = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Director Sharma', role: 'admin' },
  { id: 2, username: 'security', password: 'secure456', name: 'Vikram Rao', role: 'security' },
  { id: 3, username: 'hr', password: 'hr789', name: 'Priya Sharma', role: 'hr' },
  { id: 4, username: 'demo', password: 'demo', name: 'Demo User', role: 'viewer' },
];

const departments = ['Engineering', 'Human Resources', 'Sales', 'Finance', 'Security', 'Design', 'Marketing', 'Analytics', 'Product', 'Operations', 'AI Lab', 'IT', 'Legal', 'Strategy', 'Support'];

// Hourly activity pattern (realistic office day)
const hourlyActivityPattern = [
  { hour: '7AM', value: 5 },
  { hour: '8AM', value: 25 },
  { hour: '9AM', value: 72 },
  { hour: '10AM', value: 88 },
  { hour: '11AM', value: 92 },
  { hour: '12PM', value: 65 },
  { hour: '1PM', value: 45 },
  { hour: '2PM', value: 85 },
  { hour: '3PM', value: 90 },
  { hour: '4PM', value: 82 },
  { hour: '5PM', value: 70 },
  { hour: '6PM', value: 30 },
  { hour: '7PM', value: 12 },
];

function getRandomEmployee() {
  return employees[Math.floor(Math.random() * employees.length)];
}

function getRandomCamera() {
  return cameras[Math.floor(Math.random() * cameras.length)];
}

function getRandomAlertTemplate() {
  return alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
}

function generateTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function generateAnalyticsSnapshot() {
  const working = employees.filter(e => e.status === 'working').length;
  const onBreak = employees.filter(e => e.status === 'break').length;
  const idle = employees.filter(e => e.status === 'idle').length;
  const absent = employees.filter(e => e.status === 'absent').length;

  return {
    timestamp: new Date().toISOString(),
    totalEmployees: employees.length,
    totalPresent: working + onBreak + idle,
    working,
    onBreak,
    idle,
    absent,
    productivityScore: Math.round(70 + Math.random() * 25),
    activeCameras: cameras.filter(c => c.status === 'active').length,
    totalCameras: cameras.length,
    hourlyActivity: hourlyActivityPattern.map(h => ({
      ...h,
      value: Math.min(100, Math.max(0, h.value + Math.floor(Math.random() * 10 - 5)))
    })),
    departmentBreakdown: departments.slice(0, 8).map(dept => ({
      department: dept,
      headcount: employees.filter(e => e.department === dept).length,
      productivity: Math.round(65 + Math.random() * 30)
    }))
  };
}

// Simulate employee status changes
function simulateStatusChanges() {
  const emp = getRandomEmployee();
  const statuses = ['working', 'break', 'idle', 'working', 'working', 'working']; // weighted toward working
  const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const locations = {
    working: ['Floor A - Desk ' + Math.floor(Math.random() * 20 + 1), 'Floor B - Desk ' + Math.floor(Math.random() * 10 + 1)],
    break: ['Cafeteria', 'Terrace', 'Common Area'],
    idle: [emp.location],
    absent: ['N/A']
  };

  emp.status = newStatus;
  emp.location = locations[newStatus][Math.floor(Math.random() * locations[newStatus].length)];
  emp.lastSeen = generateTimestamp();
  
  if (newStatus === 'break') {
    emp.breakMinutes = Math.floor(Math.random() * 20 + 1);
  } else {
    emp.breakMinutes = 0;
  }
  
  return emp;
}

module.exports = {
  employees,
  cameras,
  alertTemplates,
  mockUsers,
  departments,
  hourlyActivityPattern,
  getRandomEmployee,
  getRandomCamera,
  getRandomAlertTemplate,
  generateTimestamp,
  generateAnalyticsSnapshot,
  simulateStatusChanges
};
