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

export type NavItem = {
  nameKey: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { nameKey: string; path: string }[];
};

export function getNavForRole(role: User["role"]): NavItem[] {
  switch (role) {
    case "superAdmin":
      return [
        { icon: <GridIcon />, nameKey: "dashboard", path: "/admin/dashboard" },
        { icon: <UserCircleIcon />, nameKey: "staff", path: "/admin/staff" },
        { icon: <ListIcon />, nameKey: "ingredients", path: "/admin/ingredients" },
        { icon: <TableIcon />, nameKey: "platesMenu", path: "/admin/dishes" },
        {
          icon: <DollarLineIcon />,
          nameKey: "purchaser",
          subItems: [
            { nameKey: "transfer", path: "/admin/transfers" },
            { nameKey: "transferHistory", path: "/admin/transfers/history" },
            { nameKey: "pendingPurchases", path: "/admin/purchases" },
            { nameKey: "allPurchases", path: "/admin/purchases/history" },
            { nameKey: "purchaserTodayActivity", path: "/admin/purchaser/today" },
          ],
        },
        {
          icon: <BoxCubeIcon />,
          nameKey: "chief",
          subItems: [
            { nameKey: "platesMade", path: "/admin/production" },
            { nameKey: "chiefTodayActivity", path: "/admin/chief/today" },
          ],
        },
        {
          icon: <TableIcon />,
          nameKey: "sales",
          subItems: [
            { nameKey: "salesToday", path: "/admin/sales/today" },
            { nameKey: "salesHistory", path: "/admin/sales/history" },
          ],
        },
        { icon: <PieChartIcon />, nameKey: "reports", path: "/admin/reports" },
      ];
    case "purchaser":
      return [
        {
          icon: <DollarLineIcon />,
          nameKey: "transfers",
          subItems: [
            { nameKey: "pendingTransfers", path: "/purchaser/transfers" },
            { nameKey: "transferHistory", path: "/purchaser/transfers/history" },
          ],
        },
        { icon: <ListIcon />, nameKey: "purchases", path: "/purchaser/purchases" },
        { icon: <PieChartIcon />, nameKey: "purchaseHistory", path: "/purchaser/purchases/history" },
        { icon: <TableIcon />, nameKey: "myInventory", path: "/purchaser/inventory" },
      ];
    case "chief":
      return [
        { icon: <BoxCubeIcon />, nameKey: "pendingReceipts", path: "/chief/receipts" },
        { icon: <TableIcon />, nameKey: "inventory", path: "/chief/inventory" },
        { icon: <TableIcon />, nameKey: "todaysPlates", path: "/chief/plates/today" },
        { icon: <PieChartIcon />, nameKey: "production", path: "/chief/production" },
      ];
    case "employee":
      return [
        { icon: <GridIcon />, nameKey: "pos", path: "/employee/pos" },
        { icon: <TableIcon />, nameKey: "mySales", path: "/employee/sales" },
      ];
    default:
      return [];
  }
}
