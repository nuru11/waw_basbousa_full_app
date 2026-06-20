import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  SectionCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { api, type User } from "../../services/api";
import { getRoleLabel } from "../../utils/roleRoutes";
import { translateApiError } from "../../utils/translateApiError";

const STAFF_ROLES: User["role"][] = ["superAdmin", "purchaser", "chief", "employee"];

export default function StaffPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const { t: tValidation } = useTranslation("validation");
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    role: "employee" as User["role"],
  });
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<User[]>("/admins").then(setAdmins).catch((e) => setError(translateApiError(e)));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      try {
        await api.post("/admins", form);
        setSuccess(t("staff.created"));
        setForm({ name: "", username: "", password: "", phone: "", role: "employee" });
        load();
      } catch (err: unknown) {
        setError(translateApiError(err, "admin:staff.failedToCreate"));
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm(tValidation("confirm.deleteStaff"))) return;
    try {
      await api.delete(`/admins/${id}`);
      load();
    } catch (err: unknown) {
      setError(translateApiError(err, "admin:staff.failedToDelete"));
    }
  }

  async function handleToggleStatus(admin: User) {
    const nextStatus = admin.status === "active" ? "inactive" : "active";
    const confirmKey =
      nextStatus === "inactive" ? "confirm.deactivateStaff" : "confirm.activateStaff";
    if (!confirm(tValidation(confirmKey, { name: admin.name }))) return;

    setStatusLoading(admin.id);
    setError("");
    setSuccess("");
    try {
      await api.put(`/admins/${admin.id}`, { status: nextStatus });
      setSuccess(
        nextStatus === "active" ? t("staff.memberActivated") : t("staff.memberDeactivated")
      );
      load();
    } catch (err: unknown) {
      setError(
        translateApiError(
          err,
          nextStatus === "active" ? "admin:staff.failedToActivate" : "admin:staff.failedToDeactivate"
        )
      );
    } finally {
      setStatusLoading(null);
    }
  }

  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      {
        key: "name",
        header: tCommon("fields.name"),
        render: (a) => a.name,
      },
      {
        key: "username",
        header: tCommon("fields.username"),
        render: (a) => a.username,
      },
      {
        key: "role",
        header: tCommon("fields.role"),
        render: (a) => getRoleLabel(a.role),
      },
      {
        key: "status",
        header: tCommon("fields.status"),
        render: (a) => {
          const isActive = (a.status ?? "active") === "active";
          return (
            <StatusBadge variant={isActive ? "active" : "rejected"}>
              {isActive ? tCommon("status.active") : tCommon("status.inactive")}
            </StatusBadge>
          );
        },
      },
      {
        key: "shortId",
        header: tCommon("fields.shortId"),
        render: (a) => <span className="font-mono">{a.short_id}</span>,
      },
      {
        key: "phone",
        header: tCommon("fields.phone"),
        render: (a) => a.phone || tCommon("emDash"),
      },
      {
        key: "actions",
        header: "",
        cellClassName: "whitespace-nowrap",
        render: (a) => {
          const isSelf = currentUser?.id === a.id;
          const isActive = (a.status ?? "active") === "active";
          if (isSelf) return null;
          return (
            <span className="space-x-3">
              <button
                type="button"
                onClick={() => handleToggleStatus(a)}
                disabled={statusLoading === a.id}
                className={
                  isActive
                    ? "text-warning-500 hover:underline"
                    : "text-success-500 hover:underline"
                }
              >
                {statusLoading === a.id
                  ? tCommon("ellipsis")
                  : isActive
                    ? tCommon("actions.deactivate")
                    : tCommon("actions.activate")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="text-error-500 hover:underline"
              >
                {tCommon("actions.delete")}
              </button>
            </span>
          );
        },
      },
    ],
    [currentUser?.id, statusLoading, tCommon]
  );

  return (
    <div>
      <PageMeta title={t("staff.metaTitle")} description={t("staff.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("staffManagement")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("staff.addStaff")} className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-error-500">{error}</p>}
            {success && <p className="text-sm text-success-500">{success}</p>}
            <div>
              <Label>{tCommon("fields.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{tCommon("fields.username")}</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <Label>{tCommon("fields.password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label>{tCommon("fields.phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>{tCommon("fields.role")}</Label>
              <Select
                value={form.role}
                onChange={(role) =>
                  setForm({ ...form, role: role as User["role"] })
                }
                options={STAFF_ROLES.map((value) => ({
                  value,
                  label: getRoleLabel(value),
                }))}
              />
            </div>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? tCommon("actions.creating") : tCommon("actions.create")}
            </Button>
          </form>
        </SectionCard>
        <SectionCard title={t("staff.allStaff")} className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={admins}
            keyExtractor={(a) => a.id}
            hoverRows
          />
        </SectionCard>
      </div>
    </div>
  );
}
