import { useState, useEffect } from 'react';
import { supabase } from '../libs/supabase';
import { AuditLog } from '../types';

export const useAuditLog = (planillaId: string) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planilla_audit_log_with_profile')
        .select('*')
        .eq('planilla_id', planillaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
      console.log(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planillaId) {
      fetchAuditLogs();
    }
  }, [planillaId]);

  return { auditLogs, loading, refetch: fetchAuditLogs };
};
