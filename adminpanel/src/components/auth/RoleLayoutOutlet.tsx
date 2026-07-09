import { Outlet, useLocation } from "react-router";

export default function RoleLayoutOutlet() {
  const location = useLocation();
  return <Outlet key={location.pathname} />;
}
