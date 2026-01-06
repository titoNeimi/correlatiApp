'use client';

import { useMemo } from 'react';
import { Card, Badge } from '@/components/admin/baseComponents';

export default function ObservabilityPage() {
  const incidents = useMemo(() => [
    { id: '#1024', severity: 'high', message: 'Fallo en publicación de cambios en landing', time: 'Hoy 09:15' },
    { id: '#1023', severity: 'medium', message: 'Retraso en sincronización de catálogos', time: 'Ayer 18:42' },
    { id: '#1022', severity: 'low', message: 'Error 404 en página FAQ (staging)', time: 'Ayer 12:05' },
  ], []);

  const services = useMemo(() => [
    { name: 'Frontend', status: 'ok', latency: '120ms' },
    { name: 'API', status: 'warning', latency: '320ms' },
    { name: 'BD', status: 'ok', latency: '15ms' },
  ], []);

  const logs = useMemo(() => [
    { level: 'info', message: 'Deploy completado en preview', time: 'Hoy 08:50' },
    { level: 'error', message: 'Webhook de leads respondió 500', time: 'Ayer 22:11' },
    { level: 'warn', message: 'Uso de CPU al 75% en instancia api-1', time: 'Ayer 20:04' },
  ], []);

  const severityBadge = (severity: string) => {
    const map = {
      high: { variant: 'warning' as const, label: 'Alta' },
      medium: { variant: 'info' as const, label: 'Media' },
      low: { variant: 'default' as const, label: 'Baja' },
    };
    const config = map[severity as keyof typeof map] || map.low;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statusDot = (status: string) => {
    const colorMap: Record<string, string> = {
      ok: 'bg-green-500',
      warning: 'bg-yellow-500',
      down: 'bg-red-500',
    };
    return <span className={`inline-block w-2 h-2 rounded-full ${colorMap[status] || 'bg-gray-400'}`} />;
  };

  const logBadge = (level: string) => {
    const map = {
      error: { variant: 'warning' as const, label: 'Error' },
      warn: { variant: 'info' as const, label: 'Alerta' },
      info: { variant: 'default' as const, label: 'Info' },
    };
    const config = map[level as keyof typeof map] || map.info;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Observabilidad</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea estado de servicios, errores recientes y eventos de publicación</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          Configurar alertas
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Incidentes recientes</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Ver historial
            </button>
          </div>
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {severityBadge(incident.severity)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{incident.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{incident.id} • {incident.time}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Servicios</h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Refrescar
            </button>
          </div>
          <div className="space-y-3">
            {services.map(service => (
              <div key={service.name} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {statusDot(service.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Latencia: {service.latency}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                  Logs
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Logs recientes</h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Ver todo
          </button>
        </div>
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {logBadge(log.level)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{log.time}</p>
                </div>
              </div>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                Copiar
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
