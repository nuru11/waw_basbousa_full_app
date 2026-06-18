import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type User } from "../../services/api";
import { ROLE_LABELS } from "../../utils/roleRoutes";

export default function StaffPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    role: "employee" as User["role"],
  });
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<User[]>("/admins").then(setAdmins).catch((e) => setError(e.message));
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
        setSuccess("Staff member created");
        setForm({ name: "", username: "", password: "", phone: "", role: "employee" });
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create");
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this staff member?")) return;
    try {
      await api.delete(`/admins/${id}`);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div>
      <PageMeta title="Staff | Restaurant" description="Manage staff" />
      <PageBreadcrumb pageTitle="Staff Management" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-1">
          <h3 className="mb-4 font-semibold">Add Staff</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-error-500">{error}</p>}
            {success && <p className="text-sm text-success-500">{success}</p>}
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as User["role"] })
                }
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create Staff"}
            </Button>
          </form>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <h3 className="mb-4 font-semibold">All Staff</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3">Name</th>
                <th className="pb-3">Username</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Short ID</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{a.name}</td>
                  <td className="py-3">{a.username}</td>
                  <td className="py-3">{ROLE_LABELS[a.role]}</td>
                  <td className="py-3 font-mono">{a.short_id}</td>
                  <td className="py-3">{a.phone || "-"}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-error-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
