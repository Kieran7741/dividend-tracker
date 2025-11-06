export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}
