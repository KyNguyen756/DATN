// Format currency to VND
export const formatCurrency = (value) => {
  if (!value) return '0 VND';
  return `${Number(value).toLocaleString('vi-VN')} VND`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const re = /^0[0-9]{9}$/;
  return re.test(phone);
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};
