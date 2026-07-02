import {
  GridIcon,
  ListIcon,
  TableIcon,
  PieChartIcon,
  UserCircleIcon,
  BoxCubeIcon,
  DollarLineIcon,
  FileIcon,
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
        { icon: <TableIcon />, nameKey: "beverages", path: "/admin/beverages" },
        { icon: <TableIcon />, nameKey: "platesMenu", path: "/admin/dishes" },
        {
          icon: <DollarLineIcon />,
          nameKey: "purchaser",
          subItems: [
            { nameKey: "transfer", path: "/admin/transfers" },
            { nameKey: "transferHistory", path: "/admin/transfers/history" },
            { nameKey: "inventoryLocations", path: "/admin/purchases" },
            { nameKey: "allPurchases", path: "/admin/purchases/history" },
            { nameKey: "purchaserTodayActivity", path: "/admin/purchaser/today" },
          ],
        },
        {
          icon: <BoxCubeIcon />,
          nameKey: "chief",
          subItems: [
            { nameKey: "platesMade", path: "/admin/production" },
            { nameKey: "chiefStockAdjust", path: "/admin/chief/stock" },
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
        {
          icon: <FileIcon />,
          nameKey: "operatingExpenses",
          subItems: [
            { nameKey: "salaries", path: "/admin/salaries" },
            { nameKey: "tips", path: "/admin/tips" },
            { nameKey: "recordExpense", path: "/admin/expenses" },
            { nameKey: "chiefExpenses", path: "/admin/chief-expenses" },
            { nameKey: "expenseHistory", path: "/admin/expenses/history" },
          ],
        },
        {
          icon: <PieChartIcon />,
          nameKey: "reports",
          subItems: [
            { nameKey: "reportsAllTime", path: "/admin/reports" },
            { nameKey: "monthlyAnalysis", path: "/admin/reports/monthly" },
          ],
        },
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
        { icon: <TableIcon />, nameKey: "platesMenu", path: "/chief/dishes" },
        { icon: <TableIcon />, nameKey: "todaysPlates", path: "/chief/plates/today" },
        { icon: <PieChartIcon />, nameKey: "production", path: "/chief/production" },
        { icon: <DollarLineIcon />, nameKey: "chiefExpenses", path: "/chief/expenses" },
      ];
    case "employee":
      return [
        { icon: <TableIcon />, nameKey: "mySales", path: "/employee/sales" },
      ];
    default:
      return [];
  }
}
