/**
 * Parser de CSV sin dependencias externas.
 * Soporta comas o punto y coma como separador, campos entre comillas,
 * comillas escapadas (""), saltos de línea dentro de comillas, CRLF y BOM.
 */
export function parseCsv(texto: string): string[][] {
  // Quita el BOM que agregan Excel y otros editores.
  const contenido = texto.replace(/^﻿/, "");
  const separador = detectarSeparador(contenido);

  const filas: string[][] = [];
  let campo = "";
  let fila: string[] = [];
  let dentroDeComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i];

    if (dentroDeComillas) {
      if (c === '"') {
        if (contenido[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeComillas = true;
    } else if (c === separador) {
      fila.push(campo.trim());
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && contenido[i + 1] === "\n") i++;
      fila.push(campo.trim());
      campo = "";
      if (fila.some((v) => v !== "")) filas.push(fila);
      fila = [];
    } else {
      campo += c;
    }
  }

  fila.push(campo.trim());
  if (fila.some((v) => v !== "")) filas.push(fila);

  return filas;
}

function detectarSeparador(contenido: string): string {
  const primeraLinea = contenido.split(/\r?\n/, 1)[0] ?? "";
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  const puntoYComas = (primeraLinea.match(/;/g) ?? []).length;
  return puntoYComas > comas ? ";" : ",";
}

/**
 * Descarta la fila de encabezado si la primera celda coincide con alguno de
 * los nombres esperados, para que el archivo funcione con o sin cabecera.
 */
export function quitarEncabezado(filas: string[][], encabezados: string[]): string[][] {
  const primera = filas[0]?.[0]?.toLowerCase().trim();
  if (primera && encabezados.some((h) => h.toLowerCase() === primera)) return filas.slice(1);
  return filas;
}
