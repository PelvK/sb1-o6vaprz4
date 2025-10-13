import { useState, useEffect, useCallback } from 'react';
import { api } from '../libs/api';
import { AuditLog } from '../types';

export const useAuditLog = (planillaId: string) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[DEBUG] AUDIT LOGS:", auditLogs);
  }, [auditLogs]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<AuditLog[]>(`audit.php?planilla_id=${planillaId}`);
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [planillaId]);

  useEffect(() => {
    if (planillaId) {
      fetchAuditLogs();
    }
  }, [planillaId, fetchAuditLogs]);

  return { auditLogs, loading, refetch: fetchAuditLogs };
};
