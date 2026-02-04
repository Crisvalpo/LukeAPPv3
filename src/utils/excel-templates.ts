import * as XLSX from 'xlsx'

export const downloadPersonnelTemplate = () => {
    const templateData = [
        {
            ID_INTERNO: '1001',
            RUT: '12.345.678-9',
            NOMBRE: 'JUAN PEREZ GONZALEZ',
            EMAIL: 'juan@empresa.com',
            TELEFONO: '+56912345678',
            CARGO: 'SOLDADOR',
            JORNADA: '5x2',
            TURNO: 'DIA'
        },
        {
            ID_INTERNO: '1002',
            RUT: '98.765.432-1',
            NOMBRE: 'MARIA GONZALEZ LOPEZ',
            EMAIL: 'maria@empresa.com',
            TELEFONO: '+56987654321',
            CARGO: 'CAPATAZ',
            JORNADA: '14x14',
            TURNO: 'NOCHE'
        }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Personal")
    XLSX.writeFile(wb, "plantilla_importacion_personal.xlsx")
}
