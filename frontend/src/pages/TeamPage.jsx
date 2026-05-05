import { Trash2, UserPlus } from "lucide-react";
import { palette } from "../constants";
import { Avatar } from "../components/Avatar";

export function TeamPage({ members, taskCounts, isAdmin, currentUserId, removeMember, openMemberModal }) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Team Members</h2>
          <p>Admins can create a login for a member and assign tasks to them.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openMemberModal}><UserPlus size={15} /> Add Member</button>}
      </div>
      <section className="card">
        <div className="table-list">
          {members.map((member, index) => (
            <div className="team-row" key={member.id}>
              <Avatar name={member.name} tone={palette[index % palette.length]} />
              <div>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <span className={`chip chip-${member.role === "ADMIN" ? "purple" : "blue"}`}>{member.role}</span>
              <span className="chip chip-green">{taskCounts[member.id] || 0} tasks</span>
              {isAdmin && member.id !== currentUserId && <button className="btn-icon danger" title="Remove member" onClick={() => removeMember(member.id)}><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
