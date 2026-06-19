import {
  GridIcon,
  ListIcon,
  TableIcon,
  PieChartIcon,
  UserCircleIcon,
  BoxCubeIcon,
  DollarLineIcon,
} from "../icons";
import type { User } from "../services/api";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

export function getNavForRole(role: User["role"]): NavItem[] {
  switch (role) {
    case "superAdmin":
      return [
        { icon: <GridIcon />, name: "Dashboard", path: "/admin/dashboard" },
        { icon: <UserCircleIcon />, name: "Staff", path: "/admin/staff" },
        { icon: <ListIcon />, name: "Ingredients", path: "/admin/ingredients" },
        { icon: <TableIcon />, name: "Plates / Menu", path: "/admin/dishes" },
        { icon: <DollarLineIcon />, name: "Purchaser", subItems: [
          { name: "Transfer", path: "/admin/transfers" },
          { name: "Transfer History", path: "/admin/transfers/history" },
          { name: "Pending Purchases", path: "/admin/purchases" },
          { name: "Today's Activity", path: "/admin/purchaser/today" },
        ] },
        { icon: <BoxCubeIcon />, name: "Chief", subItems: [
          { name: "Plates Made", path: "/admin/production" },
          { name: "Today's Activity", path: "/admin/chief/today" },
        ] },
        { icon: <TableIcon />, name: "Sales", subItems: [
          { name: "Today's Sales", path: "/admin/sales/today" },
          { name: "Sales History", path: "/admin/sales/history" },
        ] },
        { icon: <PieChartIcon />, name: "Reports", path: "/admin/reports" },
      ];
    case "purchaser":
      return [
        { icon: <DollarLineIcon />, name: "Transfers", subItems: [
          { name: "Pending Transfers", path: "/purchaser/transfers" },
          { name: "Transfer History", path: "/purchaser/transfers/history" },
        ] },
        { icon: <ListIcon />, name: "Purchases", path: "/purchaser/purchases" },
        { icon: <PieChartIcon />, name: "Purchase History", path: "/purchaser/purchases/history" },
        { icon: <TableIcon />, name: "My Inventory", path: "/purchaser/inventory" },
      ];
    case "chief":
      return [
        { icon: <BoxCubeIcon />, name: "Pending Receipts", path: "/chief/receipts" },
        { icon: <TableIcon />, name: "Inventory", path: "/chief/inventory" },
        { icon: <PieChartIcon />, name: "Production", path: "/chief/production" },
      ];
    case "employee":
      return [
        { icon: <GridIcon />, name: "POS", path: "/employee/pos" },
        { icon: <TableIcon />, name: "My Sales", path: "/employee/sales" },
      ];
    default:
      return [];
  }
}
