import React from "react";

export interface ExecutionNode {
  id: string;
  title: string;
  date: string;
  status: "done" | "active" | "upcoming";
  description?: string;
}

export interface ExecutionVisualizerProps {
  nodes: ExecutionNode[];
}

function statusLabel(status: ExecutionNode["status"]): string {
  if (status === "done") return "مكتمل";
  if (status === "active") return "نشط";
  return "قادم";
}

export default function ExecutionVisualizer({ nodes }: ExecutionVisualizerProps) {
  return (
    <section
      className="w-full rounded-3xl bg-[#f7fafa]"
      style={{ padding: "48px 64px 48px 32px" }}
      aria-label="Execution timeline"
    >
      <div className="flex flex-col gap-6">
        <h3 className="text-xl font-semibold text-[#003334]">الجدول الزمني للتنفيذ</h3>

        <div className="flex flex-col gap-6">
          {nodes.map((node, index) => {
            const isLast = index === nodes.length - 1;

            return (
              <div key={node.id} className="flex flex-col gap-6">
                <article
                  className="rounded-lg bg-[#003334] px-5 py-3 text-white"
                  data-status={node.status}
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <h4
                        style={{
                          fontSize: "24px",
                          fontWeight: 500,
                          letterSpacing: "0.02em",
                          lineHeight: 1.25,
                        }}
                      >
                        {node.title}
                      </h4>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "rgba(255, 255, 255, 0.75)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {node.date} - {statusLabel(node.status)}
                      </div>
                    </div>

                    {node.description ? (
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "rgba(255, 255, 255, 0.75)",
                          lineHeight: 1.7,
                        }}
                      >
                        {node.description}
                      </p>
                    ) : null}
                  </div>
                </article>

                {!isLast ? (
                  <div className="flex justify-center">
                    <svg
                      width="100%"
                      height="24"
                      viewBox="0 0 100 24"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <line x1="50" y1="0.5" x2="50" y2="23.5" stroke="rgba(0, 106, 103, 0.15)" strokeWidth="1" />
                    </svg>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
