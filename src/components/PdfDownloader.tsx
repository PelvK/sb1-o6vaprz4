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

  planilla?.jugadores.sort((a, b) => a.number - b.number);

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
    doc.text(`${planilla.team?.nombre || ""}`, 30, 28);
    doc.text(`${planilla.team?.category || ""}`, 40, 39);

    if (planilla.jugadores && planilla.jugadores.length > 0) {
        for (let i = 0; i < planilla.jugadores.length; i++) {
            const jugador = planilla.jugadores[i];
            const y = 48 + (i + 1) * 6.9;
            doc.setFont("helvetica", "bold");
            doc.text(`${jugador.number || ""}`, 9.7, y);
            doc.setFont("helvetica", "normal");
            doc.text(`${jugador.name || ""}` + (jugador.second_name ? ` ${jugador.second_name}` : ""), 17, y);
            doc.text(`${jugador.dni || ""}`, 76, y);
        }
    }

    if (planilla.personas && planilla.personas.length > 0) {
      doc.setFontSize(12);
      const tecnico = planilla.personas.find((p) => p.charge === "Técnico");
      const delegado = planilla.personas.find((p) => p.charge === "Delegado");
      const medico = planilla.personas.find((p) => p.charge === "Médico");
      
      doc.text(`${tecnico?.name || ""}` + (tecnico?.second_name ? ` ${tecnico.second_name}` : ""), 10, 182);
      doc.text(`${delegado?.name || ""}` + (delegado?.second_name ? ` ${delegado.second_name}` : ""), 10, 192);
      doc.text(`${medico?.name || ""}` + (medico?.second_name ? ` ${medico.second_name}` : ""), 10, 202);
      doc.setFontSize(10);
      doc.text(`${tecnico?.dni || ""}`, 98, 178);
      doc.text(`Tel: ${tecnico?.phone_number || ""}`, 92, 182);
      doc.text(`${delegado?.dni || ""}`, 98, 188);
      doc.text(`Tel: ${delegado?.phone_number || ""}`, 92, 192);
      doc.text(`${medico?.dni || ""}`, 98, 198);
      doc.text(`Tel: ${medico?.phone_number || ""}`, 92, 202);
    }

    doc.save(`${planilla.team?.nombre || "equipo"}_${planilla.team?.category}.pdf`);
    onClose();
  }, [planilla, loading, error, onClose]);

  if (loading) return <div>Generando PDF...</div>;
  if (error) return <div>Error al obtener datos</div>;
  return null;
};
