import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function MonitoringAccess() {
  const { perencanaanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;

    const search = new URLSearchParams(location.search);
    const docHash = search.get("docHash") || "";
    const txHash = search.get("txHash") || "";

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: `/monitoring-access/${perencanaanId}`,
            search: location.search,
          },
        },
      });
      return;
    }

    const basePath = user?.role === "admin" ? "/admin/monitoring" : "/user/monitoring";
    const target = new URLSearchParams({ perencanaan_id: String(perencanaanId || "") });

    if (docHash) target.set("docHash", docHash);
    if (txHash) target.set("txHash", txHash);
    target.set("source", "qr");

    navigate(`${basePath}?${target.toString()}`, { replace: true });
  }, [isAuthenticated, loading, navigate, perencanaanId, location.search, user?.role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Akses Monitoring Blockchain</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Memproses verifikasi blockchain dan mengarahkan ke formulir monitoring. Silakan tunggu...
        </p>
      </div>
    </div>
  );
}
