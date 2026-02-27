export const COMPANY = {
  name: "CV UTAMA SINERGI BERKARYA",
  address: "Jalan Khairil Anwar, No. 32, Peunayong",
  district: "Kec. Kuta Alam, Kota Banda Aceh, 23122",
  email: "utamasinergiberkarya@gmail.com",
  npwp: "99.332.276.7-108.000",
  director: "RIZKI JUANDA",
  directorTitle: "Direktur",
};

export const BANK_ACCOUNTS = [
  {
    id: "maybank",
    bankName: "MAYBANK SYARIAH",
    branch: "Banda Aceh",
    accountNumber: "8707036469",
    accountHolder: "RIZKI JUANDA",
  },
  {
    id: "aceh",
    bankName: "BANK ACEH SYARIAH",
    branch: "JANTHO",
    accountNumber: "01502200034451",
    accountHolder: "RIZKI JUANDA",
  },
];

export const WO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  assigned: { label: "Assigned", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}
