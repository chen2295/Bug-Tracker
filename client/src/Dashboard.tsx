import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form, Offcanvas } from "react-bootstrap";
import axios from "axios";
import BugList from "./BugList"; 

interface User {
  id: number;
  username: string;
  email?: string;
}

interface Bug {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    assignee_id?: number | string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
        localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // --- USER & TEAM SETUP ---
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : { id: 1, team_id: 1, username: "DevUser", email: "dev@example.com" };

  // --- STATS STATE ---
  const [stats, setStats] = useState({ total: 0, critical: 0, resolved: 0, in_progress: 0 });

  // --- SIDEBAR STATE ---
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    axios.get(`http://localhost:3001/bugs/team-members?team_id=${currentUser.team_id}`)
         .then(res => setTeamMembers(res.data))
         .catch(err => console.error(err));
  }, [currentUser.team_id]);

  useEffect(() => {
    if (activeTab === 'settings') return;

    let endpoint = `http://localhost:3001/bugs/stats?team_id=${currentUser.team_id}`; 
    if (activeTab === 'my_issues') endpoint = `http://localhost:3001/bugs/stats?assignee_id=${currentUser.id}`;
    
    axios.get(endpoint).then(res => setStats(res.data)).catch(console.error);
  }, [activeTab, currentUser.id, currentUser.team_id]);

  // --- HELPERS ---
  const getBugEndpoint = () => {
      if (activeTab === 'my_issues') return `/bugs?assignee_id=${currentUser.id}`;
      if (activeTab === 'dashboard') return `/bugs?team_id=${currentUser.team_id}&limit=10`;
      return `/bugs?team_id=${currentUser.team_id}`;
  };

  const getPageTitle = () => {
      if (activeTab === 'dashboard') return 'Dashboard';
      if (activeTab === 'my_issues') return 'My Issues';
      if (activeTab === 'settings') return 'Settings';
      return 'All Issues';
  };

  const getPageSubtitle = () => {
      if (activeTab === 'dashboard') return 'Welcome back! Here\'s what\'s happening with your bugs today.';
      if (activeTab === 'my_issues') return 'Here are the metrics for bugs assigned specifically to you.';
      if (activeTab === 'settings') return 'Manage your profile and application preferences.';
      return 'Manage and track all bugs for the entire team.';
  }

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [newBug, setNewBug] = useState({ title: "", description: "", priority: "Medium", status: "Open", team_id: currentUser.team_id, assignee_id: "" });
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  // --- ACTIONS ---
  const handleSaveBug = async () => {
    try {
        await axios.post('http://localhost:3001/bugs', newBug);
        setShowModal(false); 
        window.location.reload(); 
    } catch (error) { alert("Failed to save bug"); }
  };

  const handleBugClick = (bug: any) => { setSelectedBug(bug); setShowSidebar(true); };

  const handleUpdateBug = async () => {
      if (!selectedBug) return;
      try {
          await axios.put(`http://localhost:3001/bugs/${selectedBug.id}`, selectedBug);
          setShowSidebar(false);
          window.location.reload();
      } catch (error) { alert("Failed to update bug"); }
  };

  const handleDeleteBug = async () => {
      if (!selectedBug || !window.confirm("Are you sure?")) return;
      try {
          await axios.delete(`http://localhost:3001/bugs/${selectedBug.id}`);
          setShowSidebar(false);
          window.location.reload();
      } catch (error) { alert("Failed to delete bug"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
      const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
      if (confirmed) {
          try {
              await axios.delete(`http://localhost:3001/bugs/users/${currentUser.id}`);
              alert("Account deleted.");
              handleLogout(); 
          } catch (error) {
              console.error(error);
              alert("Failed to delete account.");
          }
      }
  };

  return (
    <div className="container-fluid bg-body-tertiary min-vh-100">
      <div className="row">
        
        {/* --- SIDEBAR NAV --- */}
        <nav className="col-md-2 d-none d-md-block bg-body sidebar min-vh-100 border-end">
          <div className="p-4">
            <h4 className="fw-bold text-primary mb-5"><i className="bi bi-bug-fill me-2"></i>BugTracker</h4>
            <div className="mb-3 text-secondary small">LOGGED IN AS: <br/> <strong>{currentUser.username}</strong> (Team {currentUser.team_id})</div>
            <ul className="nav flex-column gap-2">
              <li className="nav-item">
                <button className={`btn w-100 text-start border-0 fw-medium py-2 ${activeTab === 'dashboard' ? 'bg-primary-subtle text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('dashboard')}>
                  <i className="bi bi-grid-fill me-3"></i> Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button className={`btn w-100 text-start border-0 fw-medium py-2 ${activeTab === 'issues' ? 'bg-primary-subtle text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('issues')}>
                  <i className="bi bi-list-task me-3"></i> All Issues
                </button>
              </li>
              <li className="nav-item">
                <button className={`btn w-100 text-start border-0 fw-medium py-2 ${activeTab === 'my_issues' ? 'bg-primary-subtle text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('my_issues')}>
                  <i className="bi bi-person me-3"></i> My Issues
                </button>
              </li>
              <li className="nav-item">
                <button className={`btn w-100 text-start border-0 fw-medium py-2 ${activeTab === 'settings' ? 'bg-primary-subtle text-primary' : 'text-secondary'}`} onClick={() => setActiveTab('settings')}>
                  <i className="bi bi-gear me-3"></i> Settings
                </button>
              </li>
            </ul>
          </div>
          <div className="mt-auto p-4 border-top">
             <button onClick={handleLogout} className="btn btn-outline-danger w-100 btn-sm"><i className="bi bi-box-arrow-left me-2"></i> Logout</button>
          </div>
        </nav>

        {/* --- MAIN CONTENT --- */}
        <main className="col-md-10 ms-sm-auto p-4 md-p-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div><h2 className="fw-bold">{getPageTitle()}</h2><p className="text-secondary">{getPageSubtitle()}</p></div>
            {activeTab !== 'settings' && (
                <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" onClick={handleShow}><i className="bi bi-plus-lg me-2"></i> New Issue</button>
            )}
          </div>

          {/* --- VIEW: SETTINGS TAB --- */}
          {activeTab === 'settings' ? (
              <div className="row g-4">
                  {/* Profile Card - Uses 'bg-body' to be dark in dark mode */}
                  <div className="col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 bg-body">
                          <h5 className="fw-bold mb-4">My Profile</h5>
                          <Form>
                              <Form.Group className="mb-3">
                                  <Form.Label className="text-secondary small fw-bold">USERNAME</Form.Label>
                                  {/* Removed bg-light to allow dark mode inheritance */}
                                  <Form.Control type="text" value={currentUser.username} disabled />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                  <Form.Label className="text-secondary small fw-bold">EMAIL ADDRESS</Form.Label>
                                  <Form.Control type="email" value={currentUser.email || "user@example.com"} disabled />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                  <Form.Label className="text-secondary small fw-bold">TEAM ID</Form.Label>
                                  <Form.Control type="text" value={currentUser.team_id} disabled />
                              </Form.Group>
                          </Form>
                      </div>
                  </div>

                  {/* Preferences Card */}
                  <div className="col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-body">
                          <h5 className="fw-bold mb-4">App Preferences</h5>
                          <div className="d-flex justify-content-between align-items-center mb-4">
                              <div>
                                  <h6 className="mb-0 fw-semibold">Email Notifications</h6>
                                  <small className="text-secondary">Receive emails when bugs are assigned to you.</small>
                              </div>
                              <Form.Check type="switch" defaultChecked />
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                              <div>
                                  <h6 className="mb-0 fw-semibold">Dark Mode</h6>
                                  <small className="text-secondary">Switch between light and dark themes.</small>
                              </div>
                              <Form.Check 
                                type="switch" 
                                checked={darkMode}
                                onChange={() => setDarkMode(!darkMode)}
                              />
                          </div>
                      </div>

                      <div className="card border-0 shadow-sm rounded-4 p-4 border-danger-subtle bg-body">
                          <h5 className="fw-bold mb-3 text-danger">Danger Zone</h5>
                          <p className="text-secondary small">Once you delete your account, there is no going back. All bugs assigned to you will be unassigned.</p>
                          <Button variant="outline-danger" size="sm" onClick={handleDeleteAccount}>
                              Delete Account
                          </Button>
                      </div>
                  </div>
              </div>
          ) : (
              // --- VIEW: DASHBOARD/LIST ---
              <>
                {/* Stats Cards - Updated to use bg-body for Dark Mode support */}
                {activeTab === 'dashboard' && (
                    <div className="row g-4 mb-5">
                        <div className="col-md-3"><div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-body"><div className="d-flex justify-content-between align-items-center"><div><p className="text-secondary mb-2 fw-medium">Total Bugs</p><h1 className="fw-bold mb-0">{stats.total}</h1></div><div className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary" style={{ width: '60px', height: '60px' }}><i className="bi bi-bug fs-2"></i></div></div></div></div>
                        <div className="col-md-3"><div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-body"><div className="d-flex justify-content-between align-items-center"><div><p className="text-secondary mb-2 fw-medium">Open Critical Issues</p><h1 className="fw-bold mb-0">{stats.critical}</h1></div><div className="d-flex align-items-center justify-content-center rounded-3 bg-danger-subtle text-danger" style={{ width: '60px', height: '60px' }}><i className="bi bi-exclamation-circle fs-2"></i></div></div></div></div>
                        <div className="col-md-3"><div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-body"><div className="d-flex justify-content-between align-items-center"><div><p className="text-secondary mb-2 fw-medium">Bugs Resolved</p><h1 className="fw-bold mb-0">{stats.resolved}</h1></div><div className="d-flex align-items-center justify-content-center rounded-3 bg-success-subtle text-success" style={{ width: '60px', height: '60px' }}><i className="bi bi-check2-circle fs-2"></i></div></div></div></div>
                        <div className="col-md-3"><div className="card border-0 shadow-sm p-4 rounded-4 h-100 bg-body"><div className="d-flex justify-content-between align-items-center"><div><p className="text-secondary mb-2 fw-medium">In Progress</p><h1 className="fw-bold mb-0">{stats.in_progress}</h1></div><div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '60px', height: '60px', backgroundColor: '#f3e8ff', color: '#6f42c1' }}><i className="bi bi-clock fs-2"></i></div></div></div></div>
                    </div>
                )}

                <BugList 
                    dataEndpoint={getBugEndpoint()} 
                    teamMembers={teamMembers} 
                    onBugClick={handleBugClick} 
                />
              </>
          )}

          {/* --- MODALS & SIDEBARS --- */}
          
          <Modal show={showModal} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>Create New Issue</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control type="text" onChange={(e) => setNewBug({...newBug, title: e.target.value})}/></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} onChange={(e) => setNewBug({...newBug, description: e.target.value})}/></Form.Group>
                <div className="row">
                    <div className="col"><Form.Label>Priority</Form.Label><Form.Select onChange={(e) => setNewBug({...newBug, priority: e.target.value})}><option value="Medium">Medium</option><option value="High">High</option><option value="Low">Low</option></Form.Select></div>
                    <div className="col"><Form.Label>Status</Form.Label><Form.Select onChange={(e) => setNewBug({...newBug, status: e.target.value})}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option></Form.Select></div>
                </div>
                <div className="row mt-3">
                    <div className="col"><Form.Label>Assign To</Form.Label><Form.Select onChange={(e) => setNewBug({...newBug, assignee_id: e.target.value})}><option value="">Unassigned</option>{teamMembers.map(m => (<option key={m.id} value={m.id}>{m.username}</option>))}</Form.Select></div>
                </div>
              </Form>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={handleClose}>Cancel</Button><Button variant="primary" onClick={handleSaveBug}>Save Bug</Button></Modal.Footer>
          </Modal>

          <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="end" style={{ width: '500px' }}>
            <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title className="fw-bold text-secondary">{selectedBug ? `BUG-${1000 + selectedBug.id}` : 'Details'}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-4">
                {selectedBug && (
                    <Form>
                        <Form.Group className="mb-4"><Form.Control type="text" className="fs-4 fw-bold border-0 px-0 shadow-none bg-transparent" value={selectedBug.title} onChange={(e) => setSelectedBug({...selectedBug, title: e.target.value})}/></Form.Group>
                        <div className="d-flex gap-3 mb-4">
                            <div className="flex-grow-1"><label className="small text-secondary fw-bold mb-1">STATUS</label><Form.Select className="fw-medium bg-body border-0" value={selectedBug.status} onChange={(e) => setSelectedBug({...selectedBug, status: e.target.value})}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option></Form.Select></div>
                            <div className="flex-grow-1"><label className="small text-secondary fw-bold mb-1">PRIORITY</label><Form.Select className="fw-medium bg-body border-0" value={selectedBug.priority} onChange={(e) => setSelectedBug({...selectedBug, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></Form.Select></div>
                        </div>
                        <Form.Group className="mb-4"><label className="small text-secondary fw-bold mb-1">DESCRIPTION</label><Form.Control as="textarea" rows={6} className="bg-body border-0 p-3" value={selectedBug.description} onChange={(e) => setSelectedBug({...selectedBug, description: e.target.value})}/></Form.Group>
                        <Form.Group className="mb-5"><label className="small text-secondary fw-bold mb-1">ASSIGNEE</label><Form.Select className="bg-body border-0" value={selectedBug.assignee_id || ""} onChange={(e) => setSelectedBug({...selectedBug, assignee_id: e.target.value})}><option value="">Unassigned</option>{teamMembers.map(m => (<option key={m.id} value={m.id}>{m.username}</option>))}</Form.Select></Form.Group>
                        <div className="d-flex justify-content-between pt-4 border-top">
                            <Button variant="outline-danger" onClick={handleDeleteBug}><i className="bi bi-trash me-2"></i> Delete</Button>
                            <Button variant="primary px-4" onClick={handleUpdateBug}>Save Changes</Button>
                        </div>
                    </Form>
                )}
            </Offcanvas.Body>
          </Offcanvas>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;