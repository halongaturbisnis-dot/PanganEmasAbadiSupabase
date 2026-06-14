export const callPhone = (phoneNumber: string) => {
  if (!phoneNumber) return;
  window.open(`tel:${phoneNumber}`, '_self');
};

export const sendSMS = (phoneNumber: string, message?: string) => {
  if (!phoneNumber) return;
  const url = message 
    ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}` 
    : `sms:${phoneNumber}`;
  window.open(url, '_self');
};

export const sendWhatsApp = (phoneNumber: string, message?: string) => {
  if (!phoneNumber) return;
  // Format the number to remove non-numeric characters (except leading '+')
  const formattedNumber = phoneNumber.replace(/(?!^\+)\D/g, '');
  const url = message 
    ? `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}` 
    : `https://api.whatsapp.com/send?phone=${formattedNumber}`;
  window.open(url, '_blank');
};

export const sendEmail = (email: string, subject?: string, body?: string) => {
  if (!email) return;

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // Pada mobile device, mailto biasanya akan membuka aplikasi bawaan dengan lancar
    let url = `mailto:${email}`;
    const params: string[] = [];
    
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    window.open(url, '_self');
  } else {
    // Pada desktop (terutama di browser/PWA) seringkali mailto tidak ditangani aplikasi yg benar.
    // Sebagai alternatif/backup, kita gunakan mail.google.com
    let url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    if (subject) url += `&su=${encodeURIComponent(subject)}`;
    if (body) url += `&body=${encodeURIComponent(body)}`;
    
    window.open(url, '_blank');
  }
};
