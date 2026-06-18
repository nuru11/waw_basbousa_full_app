import type { Purchase } from "../services/api";

export function purchaseStatusLabel(status: Purchase["status"]) {
  switch (status) {
    case "in_inventory":
      return "In My Inventory";
    case "handed":
      return "Handed to Chief";
    case "received":
      return "Received by Chief";
    default:
      return status;
  }
}
