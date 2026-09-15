import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAudit } from "@/lib/db/accounts-repository";

export const metadata = { title: "Activity" };

const ACTION_LABEL: Record<string, string> = {
  "export-csv": "Exported CSV",
  cancel: "Cancelled",
  "cancel+refund": "Cancelled and refunded",
  "refund-issue": "Refunded charge",
  "dismiss-issue": "Marked handled",
  "resend-confirmation": "Resent confirmation",
  block: "Blocked time",
  unblock: "Removed block",
};

const UUID = /^[0-9a-f-]{36}$/;

export default async function AdminActivity() {
  await requireAdmin("/admin/activity");
  const entries = listAudit(200);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold text-text-primary">Activity</h1>
        <p className="text-text-secondary">Every cancellation, refund, block-out and export, and who did it.</p>
      </div>
      {entries.length === 0 ? (
        <p className="text-text-secondary">Nothing yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-token-md border border-border-subtle">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="bg-surface text-left text-text-secondary">
              <tr>{["When", "Who", "Action", "Target", "Detail"].map((h) => <th key={h} className="border-b border-border-subtle p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0">
                  <td className="tabular p-3 text-text-secondary">{new Date(e.created_at).toLocaleString("en-US")}</td>
                  <td className="p-3 text-text-primary">{e.actor_email}</td>
                  <td className="p-3 font-medium text-text-primary">{ACTION_LABEL[e.action] ?? e.action}</td>
                  <td className="tabular p-3">
                    {UUID.test(e.target) && !e.action.includes("block") ? (
                      <Link href={`/admin/bookings/${e.target}`} className="text-text-accent hover:underline">{e.target.slice(0, 8)}</Link>
                    ) : (
                      <span className="text-text-secondary">{UUID.test(e.target) ? e.target.slice(0, 8) : e.target.slice(0, 40)}</span>
                    )}
                  </td>
                  <td className="p-3 text-text-secondary">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
