import { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
}

interface Bug {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  assignee_id?: number;
}

interface BugListProps {
  dataEndpoint: string;
  teamMembers: User[]; 
  onBugClick: (bug: Bug) => void;
}

function BugList({ dataEndpoint, teamMembers, onBugClick }: BugListProps) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001${dataEndpoint}`)
      .then(res => {
        setBugs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching bugs:", err);
        setLoading(false);
      });
  }, [dataEndpoint]); 

  // --- 1. HANDLE CHANGES (Priority, Status, Assignee) ---
  
  const handleUpdate = async (e: any, bugId: number, field: string) => {
    e.stopPropagation(); // Prevent row click
    const value = e.target.value;

    // Optimistic Update (Update UI immediately)
    setBugs(bugs.map(b => b.id === bugId ? { ...b, [field]: value } : b));

    try {
        // Prepare payload (handle assignee_id special case)
        const payload = field === 'assignee_id' 
            ? { assignee_id: value === "" ? null : value } 
            : { [field]: value };

        await axios.put(`http://localhost:3001/bugs/${bugId}`, payload);
    } catch (error) {
        alert("Failed to update bug");
        // Optional: Revert changes here if needed
    }
  };

  // --- 2. STYLE HELPERS (To keep the colorful look) ---

  const getPriorityClass = (priority: string) => {
    const base = "form-select form-select-sm border-0 fw-medium px-3 text-center "; 
    switch (priority) {
      case 'High': return base + "bg-danger-subtle text-danger";
      case 'Medium': return base + "bg-warning-subtle text-warning-emphasis";
      case 'Low': return base + "bg-secondary-subtle text-secondary";
      default: return base + "bg-light text-dark";
    }
  };

  const getStatusClass = (status: string) => {
    const base = "form-select form-select-sm border-0 fw-medium px-3 text-center ";
    switch (status) {
      case 'Open': return base + "bg-primary-subtle text-primary";
      case 'In Progress': return base + "bg-purple-subtle text-purple"; // Custom style needed or use style prop
      case 'Resolved': return base + "bg-success-subtle text-success";
      default: return base + "bg-light text-dark";
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="mb-0 fw-bold">
            {dataEndpoint.includes('limit') ? 'Recent Activity' : 'Full Issue List'}
        </h5>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr className="text-secondary text-uppercase fs-7" style={{ fontSize: '0.85rem' }}>
              <th className="ps-4">Issue ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : bugs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No bugs found.</td></tr>
            ) : (
                bugs.map((bug) => (
                    <tr key={bug.id} style={{ cursor: 'pointer' }}>
                        
                        {/* ID & Title Click opens Sidebar */}
                        <td className="ps-4 fw-medium text-dark" onClick={() => onBugClick(bug)}>
                            BUG-{1000 + bug.id}
                        </td>
                        <td className="fw-semibold text-dark" onClick={() => onBugClick(bug)}>
                            {bug.title}
                        </td>
                        
                        {/* PRIORITY DROPDOWN */}
                        <td>
                            <select 
                                className={getPriorityClass(bug.priority)}
                                value={bug.priority}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdate(e, bug.id, 'priority')}
                                style={{ width: '110px', cursor: 'pointer' }}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </td>

                        {/* STATUS DROPDOWN */}
                        <td>
                            <select 
                                className={getStatusClass(bug.status)}
                                value={bug.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdate(e, bug.id, 'status')}
                                style={{ 
                                    width: '130px', 
                                    cursor: 'pointer',
                                    // Custom purple for "In Progress"
                                    ...(bug.status === 'In Progress' ? { backgroundColor: '#f3e8ff', color: '#6f42c1' } : {}) 
                                }}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </td>
                        
                        {/* ASSIGNEE DROPDOWN */}
                        <td>
                            <select 
                                className="form-select form-select-sm border-0 bg-transparent fw-medium text-primary"
                                value={bug.assignee_id || ""}
                                onClick={(e) => e.stopPropagation()} 
                                onChange={(e) => handleUpdate(e, bug.id, 'assignee_id')}
                                style={{ cursor: 'pointer', maxWidth: '150px' }}
                            >
                                <option value="" className="text-muted">Unassigned</option>
                                {teamMembers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </td>

                        <td className="text-secondary" onClick={() => onBugClick(bug)}>
                            {new Date(bug.created_at).toLocaleDateString()}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BugList;