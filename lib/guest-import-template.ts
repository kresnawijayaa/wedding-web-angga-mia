import writeExcelFile from "write-excel-file/node";

export async function createGuestImportTemplate() {
  const headerStyle = { fontWeight: "bold" as const, textColor: "#F3EEE4", backgroundColor: "#293026", height: 28 };
  return writeExcelFile([
    [
      { value: "Nama Tamu", ...headerStyle },
      { value: "Nomor WhatsApp", ...headerStyle },
      { value: "Jumlah Tamu", ...headerStyle },
    ],
    [
      { value: "Kresna Wijaya & Partner", type: String },
      { value: "081314250902", type: String },
      { value: 2, type: Number },
    ],
    [
      { value: "Om Dedi & Keluarga", type: String },
      { value: "081234567890", type: String },
      { value: 4, type: Number },
    ],
  ], {
    columns: [{ width: 34 }, { width: 22 }, { width: 16 }],
    sheet: "Daftar Tamu",
  }).toBuffer();
}
