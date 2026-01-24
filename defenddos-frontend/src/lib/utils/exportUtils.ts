/**
 * Data Export Utilities
 * Provides functionality to export data in various formats (CSV, JSON, PDF)
 */

// Download utility function
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data as CSV
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Use provided columns or infer from first object
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create CSV header
  const headers = cols.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(row => 
    cols.map(col => {
      const value = row[col.key];
      // Handle nested objects and arrays
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      // Escape quotes and wrap in quotes if contains comma or quotes
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${stringValue.replace(/"/g, '""')}"` 
        : stringValue;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadFile(blob, `${filename}.csv`);
};

/**
 * Export data as JSON
 */
export const exportToJSON = <T>(data: T, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  downloadFile(blob, `${filename}.json`);
};

/**
 * Export traffic data specifically formatted for DefenDDoS
 */
export const exportTrafficData = (trafficData: any[], dateRange: string) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `defenddos-traffic-${dateRange}-${timestamp}`;
  
  const columns = [
    { key: 'sourceIp', label: 'Source IP' },
    { key: 'totalPackets', label: 'Total Packets' },
    { key: 'totalBytes', label: 'Total Bytes (MB)' },
    { key: 'connectionCount', label: 'Connections' },
    { key: 'avgPacketSize', label: 'Avg Packet Size' },
    { key: 'threatScore', label: 'Threat Score' },
    { key: 'status', label: 'Status' },
    { key: 'firstSeen', label: 'First Seen' },
    { key: 'lastSeen', label: 'Last Seen' }
  ];
  
  // Format data for export
  const formattedData = trafficData.map(item => ({
    ...item,
    totalBytes: (item.totalBytes / (1024 * 1024)).toFixed(2), // Convert to MB
    avgPacketSize: item.avgPacketSize?.toFixed(2) || 'N/A',
    threatScore: item.threatScore?.toFixed(2) || '0.00',
    firstSeen: new Date(item.firstSeen || Date.now()).toLocaleString(),
    lastSeen: new Date(item.lastSeen || Date.now()).toLocaleString()
  }));
  
  exportToCSV(formattedData, filename, columns);
};

/**
 * Export blocked IPs data
 */
export const exportBlockedIPs = (blockedIPs: any[]) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `defenddos-blocked-ips-${timestamp}`;
  
  const columns = [
    { key: 'ip', label: 'IP Address' },
    { key: 'reason', label: 'Block Reason' },
    { key: 'severity', label: 'Severity' },
    { key: 'blockedAt', label: 'Blocked At' },
    { key: 'blockedBy', label: 'Blocked By' },
    { key: 'country', label: 'Country' },
    { key: 'asn', label: 'ASN' }
  ];
  
  const formattedData = blockedIPs.map(item => ({
    ...item,
    blockedAt: new Date(item.blockedAt || Date.now()).toLocaleString(),
    severity: item.severity?.toUpperCase() || 'UNKNOWN',
    blockedBy: item.blockedBy?.toUpperCase() || 'SYSTEM'
  }));
  
  exportToCSV(formattedData, filename, columns);
};

/**
 * Export threat detection data
 */
export const exportThreatData = (threats: any[]) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `defenddos-threats-${timestamp}`;
  
  const columns = [
    { key: 'ip', label: 'Source IP' },
    { key: 'type', label: 'Attack Type' },
    { key: 'severity', label: 'Severity' },
    { key: 'requestCount', label: 'Request Count' },
    { key: 'dataVolume', label: 'Data Volume (MB)' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'asn', label: 'ASN' },
    { key: 'timestamp', label: 'First Detected' }
  ];
  
  const formattedData = threats.map(item => ({
    ...item,
    dataVolume: (item.dataVolume / (1024 * 1024)).toFixed(2), // Convert to MB
    requestCount: item.requestCount?.toLocaleString() || '0',
    severity: item.severity?.toUpperCase() || 'UNKNOWN',
    timestamp: new Date(item.timestamp || Date.now()).toLocaleString()
  }));
  
  exportToCSV(formattedData, filename, columns);
};

/**
 * Export system monitoring data
 */
export const exportSystemReport = (systemData: {
  metrics: any;
  services: any[];
  alerts: any[];
}) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `defenddos-system-report-${timestamp}`;
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      cpuUsage: systemData.metrics?.cpu?.usage || 0,
      memoryUsage: systemData.metrics?.memory?.percentage || 0,
      diskUsage: systemData.metrics?.disk?.percentage || 0,
      networkTraffic: systemData.metrics?.network?.total || 0
    },
    services: systemData.services.map(service => ({
      name: service.name,
      status: service.status,
      uptime: service.uptime,
      responseTime: service.responseTime,
      lastCheck: service.lastCheck
    })),
    recentAlerts: systemData.alerts.map(alert => ({
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      source: alert.source
    }))
  };
  
  exportToJSON(report, filename);
};

/**
 * Generate comprehensive DefenDDoS analytics report
 */
export const exportAnalyticsReport = (analyticsData: {
  traffic: any[];
  blockedIPs: any[];
  threats: any[];
  system: any;
  dateRange: string;
}) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `defenddos-analytics-report-${analyticsData.dateRange}-${timestamp}`;
  
  const report = {
    reportInfo: {
      title: 'DefenDDoS Security Analytics Report',
      generatedAt: new Date().toISOString(),
      dateRange: analyticsData.dateRange,
      version: '1.0'
    },
    summary: {
      totalTrafficRecords: analyticsData.traffic?.length || 0,
      totalBlockedIPs: analyticsData.blockedIPs?.length || 0,
      totalThreats: analyticsData.threats?.length || 0,
      systemHealth: analyticsData.system?.health || 'unknown'
    },
    trafficAnalysis: {
      totalPackets: analyticsData.traffic?.reduce((sum, t) => sum + (t.totalPackets || 0), 0) || 0,
      totalBytes: analyticsData.traffic?.reduce((sum, t) => sum + (t.totalBytes || 0), 0) || 0,
      uniqueSourceIPs: new Set(analyticsData.traffic?.map(t => t.sourceIp) || []).size,
      topSourceIPs: analyticsData.traffic?.slice(0, 10) || []
    },
    threatAnalysis: {
      criticalThreats: analyticsData.threats?.filter(t => t.severity === 'critical')?.length || 0,
      highThreats: analyticsData.threats?.filter(t => t.severity === 'high')?.length || 0,
      mediumThreats: analyticsData.threats?.filter(t => t.severity === 'medium')?.length || 0,
      attackTypes: getAttackTypeDistribution(analyticsData.threats || []),
      geographicDistribution: getGeographicDistribution(analyticsData.threats || [])
    },
    mitigationSummary: {
      totalBlocked: analyticsData.blockedIPs?.length || 0,
      autoBlocked: analyticsData.blockedIPs?.filter(ip => ip.blockedBy === 'auto')?.length || 0,
      manualBlocked: analyticsData.blockedIPs?.filter(ip => ip.blockedBy === 'manual')?.length || 0,
      topBlockedCountries: getTopBlockedCountries(analyticsData.blockedIPs || [])
    },
    recommendations: generateSecurityRecommendations(analyticsData)
  };
  
  exportToJSON(report, filename);
};

/**
 * Helper function to get attack type distribution
 */
const getAttackTypeDistribution = (threats: any[]) => {
  const distribution: Record<string, number> = {};
  threats.forEach(threat => {
    const type = threat.type || 'Unknown';
    distribution[type] = (distribution[type] || 0) + 1;
  });
  return distribution;
};

/**
 * Helper function to get geographic distribution
 */
const getGeographicDistribution = (threats: any[]) => {
  const distribution: Record<string, number> = {};
  threats.forEach(threat => {
    const country = threat.country || 'Unknown';
    distribution[country] = (distribution[country] || 0) + 1;
  });
  return Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [country, count]) => ({ ...obj, [country]: count }), {});
};

/**
 * Helper function to get top blocked countries
 */
const getTopBlockedCountries = (blockedIPs: any[]) => {
  const countries: Record<string, number> = {};
  blockedIPs.forEach(ip => {
    const country = ip.country || 'Unknown';
    countries[country] = (countries[country] || 0) + 1;
  });
  return Object.entries(countries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .reduce((obj, [country, count]) => ({ ...obj, [country]: count }), {});
};

/**
 * Generate security recommendations based on analytics data
 */
const generateSecurityRecommendations = (data: any) => {
  const recommendations: string[] = [];
  
  if (data.threats?.length > 50) {
    recommendations.push('High threat activity detected. Consider increasing security alert thresholds.');
  }
  
  const criticalThreats = data.threats?.filter((t: any) => t.severity === 'critical')?.length || 0;
  if (criticalThreats > 5) {
    recommendations.push('Multiple critical threats detected. Review and strengthen DDoS protection rules.');
  }
  
  const autoBlockRate = (data.blockedIPs?.filter((ip: any) => ip.blockedBy === 'auto')?.length || 0) / 
                       Math.max(data.blockedIPs?.length || 1, 1);
  if (autoBlockRate < 0.8) {
    recommendations.push('Low automatic blocking rate. Consider tuning ML detection sensitivity.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System performing well. Continue monitoring for emerging threats.');
  }
  
  return recommendations;
};

/**
 * Export utility with toast notifications
 */
export const exportWithNotification = async (
  exportFunction: () => void | Promise<void>,
  successMessage: string = 'Data exported successfully'
) => {
  try {
    await exportFunction();
    
    // Show success notification (if toast is available)
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success(successMessage);
    }
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    
    // Show error notification (if toast is available)
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.error('Failed to export data');
    }
    
    throw error;
  }
};