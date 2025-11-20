import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState({});
  const [machines, setMachines] = useState({});

  useEffect(() => {
    const unsubUsers = onValue(ref(db, "users"), (snap) => {
      setUsers(snap.val() || {});
    });
    const unsubMachines = onValue(ref(db, "machines"), (snap) => {
      setMachines(snap.val() || {});
    });
    return () => { unsubUsers(); unsubMachines(); };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard Admin</h1>

      {/* Group machines by owner_uid and render under each school user */}
      {Object.entries(users)
        .filter(([, u]) => (u?.role === "school"))
        .map(([uid, u]) => {
          const owned = Object.entries(machines)
            .filter(([, m]) => m?.owner_uid === uid)
            .map(([mid, m]) => ({ mid, m }));
          return (
            <div key={uid} className="border p-4 mb-4 rounded">
              <h2 className="font-semibold mb-2">{u?.email || uid}</h2>
              {owned.length === 0 ? (
                <div className="text-gray-500">Tidak ada mesin</div>
              ) : (
                owned.map(({ mid, m }) => (
                  <div key={mid} className="border p-3 mb-2 rounded">
                    <div className="font-medium">{mid} {m?.meta?.name ? `- ${m.meta.name}` : ""}</div>
                    <div>📦 Stok: {m?.stock_info?.current_stock ?? m?.status?.current_stock ?? "-"} / {m?.stock_info?.initial_stock ?? "-"}</div>
                    <div>⏱ Update: {m?.status?.last_update ?? "-"}</div>
                  </div>
                ))
              )}
            </div>
          );
        })}
    </div>
  );
}
