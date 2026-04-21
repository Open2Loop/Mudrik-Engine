import React from "react";

export interface GapItem {
  id: string;
  label: string;
  status: "critical" | "completed" | "pending";
  description?: string;
}

export interface GapAnalysisVisualizerProps {
  data: GapItem[];
}

function getBubbleStyle(status: GapItem["status"]): React.CSSProperties {
  if (status === "critical") {
    return {
      background: "rgba(0, 51, 52, 0.10)",
      boxShadow: "0 0 40px rgba(0, 51, 52, 0.05)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    };
  }

  if (status === "completed") {
    return {
      background: "#dff5f4",
      color: "#006a67",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    };
  }

  return {
    background: "rgba(255, 255, 255, 0.80)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };
}

function getStatusLabel(status: GapItem["status"]): string {
  if (status === "critical") return "حرج";
  if (status === "completed") return "مكتمل";
  return "قيد المتابعة";
}

export function GapAnalysisVisualizer({ data }: GapAnalysisVisualizerProps) {
  return (
    <section
      className="w-full rounded-[2rem] p-6 md:p-8"
      style={{ background: "#f7fafa" }}
      aria-label="Gap Analysis Visualizer"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#003334]">تحليل الفجوات</h3>
        <p className="mt-1 text-sm text-[#3a5f5f]">عرض بصري لحالة المتطلبات بدون حدود فاصلة.</p>
      </div>

      <div className="flex flex-wrap gap-4 md:gap-5">
        {data.map((item) => (
          <article
            key={item.id}
            className="min-h-[130px] w-full rounded-3xl p-5 sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.85rem)]"
            style={getBubbleStyle(item.status)}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h4 className="text-base font-semibold leading-snug text-inherit">{item.label}</h4>
              <span className="shrink-0 text-xs font-medium text-inherit/80">{getStatusLabel(item.status)}</span>
            </div>
            {item.description ? (
              <p className="text-sm leading-relaxed text-inherit/85">{item.description}</p>
            ) : (
              <p className="text-sm leading-relaxed text-inherit/60">لا يوجد وصف إضافي.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default GapAnalysisVisualizer;
