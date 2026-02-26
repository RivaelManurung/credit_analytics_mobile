import { Kunjungan, User } from '../types';

export const currentUser: User = {
    id: 'USR-001',
    nama: 'Agus Pratama',
    jabatan: 'Credit Analyst',
};

export const kunjunganHariIni: Kunjungan[] = [
    {
        id: 'KJG-001',
        tanggal: '2026-02-26',
        status: 'dijadwalkan',
        nasabah: {
            id: 'NSB-001',
            nomorPinjaman: 'APP-2026-00123',
            nama: 'Budi Santoso',
            jumlahPinjaman: 50000000,
            alamat: 'Jl. Sudirman No.15, Jakarta Selatan',
            telepon: '0812-3456-7890',
            status: 'pending',
        },
    },
    {
        id: 'KJG-002',
        tanggal: '2026-02-26',
        status: 'dijadwalkan',
        nasabah: {
            id: 'NSB-002',
            nomorPinjaman: 'APP-2026-00124',
            nama: 'Siti Nurhaliza',
            jumlahPinjaman: 75000000,
            alamat: 'Jl. Gatot Subroto Kav.22, Jakarta Pusat',
            telepon: '0813-9876-5432',
            status: 'pending',
        },
    },
    {
        id: 'KJG-003',
        tanggal: '2026-02-26',
        status: 'dijadwalkan',
        nasabah: {
            id: 'NSB-003',
            nomorPinjaman: 'APP-2026-00125',
            nama: 'Rudi Hermawan',
            jumlahPinjaman: 120000000,
            alamat: 'Jl. Kebon Jeruk No.8, Jakarta Barat',
            telepon: '0821-5544-3322',
            status: 'pending',
        },
    },
];

export const formatRupiah = (angka: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(angka);
};
