import { motion } from "framer-motion";
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle } from "react-icons/fi";

/**
 * Komponen untuk menampilkan rekomendasi tindakan perbaikan
 */
export default function RecommendationsSection({ recommendations }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const getIconAndColor = (level) => {
    switch (level) {
      case "KRITIS":
        return {
          icon: FiAlertTriangle,
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
          text: "text-red-700 dark:text-red-300",
        };
      case "TINGGI":
        return {
          icon: FiAlertCircle,
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          badge: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
          text: "text-yellow-700 dark:text-yellow-300",
        };
      case "SEDANG":
        return {
          icon: FiInfo,
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
          text: "text-blue-700 dark:text-blue-300",
        };
      case "BAIK":
        return {
          icon: FiCheckCircle,
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          badge: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
          text: "text-green-700 dark:text-green-300",
        };
      default:
        return {
          icon: FiInfo,
          bg: "bg-gray-50 dark:bg-gray-900/20",
          border: "border-gray-200 dark:border-gray-800",
          badge: "bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300",
          text: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Tidak ada rekomendasi khusus tersedia.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {recommendations.map((rec, idx) => {
        const styles = getIconAndColor(rec.level);
        const IconComponent = styles.icon;

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className={`rounded-lg border-2 ${styles.border} ${styles.bg} p-4`}
          >
            <div className="flex gap-3">
              <div className={`flex-shrink-0 mt-1 ${styles.text}`}>
                <IconComponent size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${styles.badge}`}>
                    {rec.level === "KRITIS" && "⚠️ KRITIS"}
                    {rec.level === "TINGGI" && "⚠ TINGGI"}
                    {rec.level === "SEDANG" && "ℹ SEDANG"}
                    {rec.level === "BAIK" && "✓ BAIK"}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${styles.text}`}>{rec.text}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
