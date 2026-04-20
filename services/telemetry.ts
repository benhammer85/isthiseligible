
export const trackSearch = (itemName: string, status: string) => {
  // 1. Log to Google Analytics (if configured)
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'bike_benefit_search', {
      'item_name': itemName,
      'eligibility_status': status,
      'timestamp': new Date().toISOString()
    });
  }

  // 2. Secondary Webhook (Optional: Can be used to send to a private Google Sheet via Zapier)
  // To use this, add VITE_TELEMETRY_WEBHOOK to your environment variables
  const webhookUrl = (import.meta as any).env?.VITE_TELEMETRY_WEBHOOK;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'search_performed',
        itemName,
        status,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {/* silent fail to avoid interrupting user */});
  }
};

export const trackPageView = (page: string) => {
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      'page_title': page
    });
  }
};