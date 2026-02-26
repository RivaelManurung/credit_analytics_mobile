export interface User {
    id: string;
    nama: string;
    jabatan: string;
    avatar?: string;
}

export interface Nasabah {
    id: string;
    nomorPinjaman: string;
    nama: string;
    jumlahPinjaman: number;
    alamat: string;
    telepon?: string;
    status: 'pending' | 'selesai' | 'dibatalkan';
}

export interface Kunjungan {
    id: string;
    nasabah: Nasabah;
    tanggal: string;
    waktuMulai?: string;
    waktuSelesai?: string;
    status: 'dijadwalkan' | 'berlangsung' | 'selesai';
    catatan?: string;
}

export type RootDrawerParamList = {
    Main: undefined;
};

export type RootStackParamList = {
    Dashboard: undefined;
    Survey: { kunjungan: Kunjungan };
    SurveySelesai: { kunjunganId: string };
};
