import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";

/**
 * Komponen untuk mengedit narasi evaluasi
 */
export default function NarrativeEditor({ narratives, onSave }) {
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState(narratives);

  const handleEdit = (field) => {
    setEditingField(field);
  };

  const handleChange = (field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (field) => {
    onSave(field, editValues[field]);
    setEditingField(null);
  };

  const handleCancel = (field) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: narratives[field],
    }));
    setEditingField(null);
  };

  const fields = [
    { id: "survivalRate", label: "a. Survival Rate" },
    { id: "height", label: "b. Tinggi Bibit Rata-rata" },
    { id: "diameter", label: "c. Diameter Batang Rata-rata" },
    { id: "health", label: "d. Kondisi Kesehatan Bibit Tanaman" },
  ];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <motion.div
          key={field.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{field.label}</h4>
            {editingField !== field.id && (
              <button
                onClick={() => handleEdit(field.id)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                title="Edit narasi"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingField === field.id ? (
              <motion.div
                key={`edit-${field.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  value={editValues[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full min-h-[120px] p-3 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 resize-none"
                  placeholder="Masukkan narasi..."
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSave(field.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <FiCheck size={16} /> Simpan
                  </button>
                  <button
                    onClick={() => handleCancel(field.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium text-sm transition-colors"
                  >
                    <FiX size={16} /> Batal
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key={`view-${field.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm"
              >
                {editValues[field.id] || "-"}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
