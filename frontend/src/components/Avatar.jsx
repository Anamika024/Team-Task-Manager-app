import { initials } from "../utils/taskUtils";

export function Avatar({ name = "User", tone = "purple", small = false, tiny = false }) {
  return <div className={`avatar ${small ? "avatar-sm" : ""} ${tiny ? "avatar-xs" : ""} av-${tone}`}>{initials(name)}</div>;
}
