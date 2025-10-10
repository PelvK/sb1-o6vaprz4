import { useEffect } from "react";
import jsPDF from "jspdf";
import { usePlanilla } from "../hooks/usePlanillas";
import { PDF_BACKGROUND } from "../types/consts";

export const PdfDownloader = ({
  planillaId,
  onClose,
}: {
  planillaId: string;
  onClose: () => void;
}) => {
  const { planilla, loading, error } = usePlanilla(planillaId);

  useEffect(() => {
    if (loading || error || !planilla) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.addImage(PDF_BACKGROUND, "PNG", 0, 0, 297, 210);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${planilla.team?.nombre || ""}`, 30, 27);
    doc.text(`${planilla.team?.category || ""}`, 40, 38);

    if (planilla.jugadores && planilla.jugadores.length > 0) {
        for (let i = 0; i < 18; i++) {
            const jugador = planilla.jugadores.find(j => j.number === i + 1);
            const y = 48 + (i + 1) * 7.2;
            if (jugador && jugador.number === i + 1) {
            doc.setFont("helvetica", "bold");
            doc.text(`${jugador.name || ""}` + (jugador.second_name ? ` ${jugador.second_name}` : ""), 17, y);
            doc.text(`${jugador.dni || ""}`, 87, y);
            }
            else {
            doc.setFont("helvetica", "normal");
            doc.text(`-----------------`, 17, y);
            doc.text(`-----------------`, 87, y);
            }
        }
    }

    if (planilla.personas && planilla.personas.length > 0) {
      doc.setFontSize(12);
      const tecnico = planilla.personas.find((p) => p.charge === "Técnico");
      const delegado = planilla.personas.find((p) => p.charge === "Delegado");
      doc.text(`${tecnico?.name || ""}` + (tecnico?.second_name ? ` ${tecnico.second_name}` : ""), 10, 189);
      doc.text(`${tecnico?.dni || ""}`, 85, 189);
      doc.text(`${delegado?.name || ""}` + (delegado?.second_name ? ` ${delegado.second_name}` : ""), 10, 200);
      doc.text(`${delegado?.dni || ""}`, 85, 200);
    }

    doc.save(`${planilla.team?.nombre || "equipo"}_${planilla.team?.category}.pdf`);
    onClose();
  }, [planilla, loading, error, onClose]);

  if (loading) return <div>Generando PDF...</div>;
  if (error) return <div>Error al obtener datos</div>;
  return null;
};
