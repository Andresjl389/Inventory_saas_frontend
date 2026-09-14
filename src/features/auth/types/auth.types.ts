/** `UserDTO` del backend. */
export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
};

export function fullName(user: Pick<User, "first_name" | "last_name">): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
