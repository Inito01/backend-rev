import fs from 'fs/promises';
import { ocrSpace } from 'ocr-space-api-wrapper';

class SimpleAnalyzer {
  constructor(apiKey = process.env.OCR_SPACE_API_KEY) {
    this.apiKey = apiKey;
  }

  async analyzeDocument(file) {
    try {
      if (file.mimetype === 'application/pdf') {
        return await this.analyzePDF(file);
      } else if (file.mimetype.startsWith('image/')) {
        return await this.analyzeImage(file);
      }

      throw new Error(`Tipo no soportado: ${file.mimetype}`);
    } catch (error) {
      throw new Error(`Error de analisis: ${error.message}`);
    }
  }

  async analyzePDF(file) {
    try {
      let text = '';

      const result = await ocrSpace(file.path, {
        apiKey: this.apiKey,
        language: 'spa',
        OCREngine: 2,
        scale: true,
        isTable: false,
        filetype: 'pdf',
      });

      if (result && result.ParsedResults && result.ParsedResults[0]) {
        text = result.ParsedResults[0].ParsedText || '';
      }

      if (text.length < 100) {
        try {
          const pdf = await import('pdf-parse');
          const buffer = await fs.readFile(file.path);
          const data = await pdf.default(buffer);
          text = data.text || text;
        } catch (pdfError) {
          console.warn(
            'Error al usar pdf-parse como respaldo:',
            pdfError.message
          );
        }
      }

      const extractedData = this.extractVehicleData(text);
      const analysis = this.performContentAnalysis(text);

      const confidence = this.calculateConfidence(analysis, extractedData);
      const status = this.determinateStatus(confidence);
      const issues = this.collectIssues(analysis, extractedData, confidence);

      return {
        type: 'PDF',
        status,
        confidence,
        isAuthentic: confidence >= 70,
        issues,
        extractedData,
        details: {
          ...analysis,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          uploadPath: file.path,
        },
        summary: this.generateSummary(status, confidence, issues),
        rawText: text.substring(0, 500),
      };
    } catch (error) {
      console.error('Error completo al analizar PDF:', error);
      throw new Error(`Error al analizar pdf: ${error.message}`);
    }
  }

  async analyzeImage(file) {
    try {
      const sharp = await import('sharp');
      const imageBuffer = await fs.readFile(file.path);

      const processedBuffer = await sharp
        .default(imageBuffer)
        .resize(1800, null, { withoutEnlargement: true })
        .greyscale()
        .normalise()
        .sharpen()
        .toBuffer();

      const processedImagePath = `${file.path}-proccesed.png`;
      await fs.writeFile(processedImagePath, processedBuffer);

      const result = await ocrSpace(processedImagePath, {
        apiKey: this.apiKey,
        language: 'spa',
        OCREngine: 2,
        scale: true,
        isTable: false,
      });

      try {
        // esto elimina el archivo temporal despues de usarlo
        await fs.unlink(processedImagePath);
      } catch (error) {
        console.warn(
          'No se pudo eliminar el archivo temporar de imagen procesada'
        );
      }

      let text = '';
      let ocrConfidence = 0;

      if (result && result.ParsedResults && result.ParsedResults[0]) {
        text = result.ParsedResults[0].ParsedText || '';
        if (
          result.ParsedResults[0].TextOverlay &&
          result.ParsedResults[0].TextOverlay.Lines
        ) {
          const lines = result.ParsedResults[0].TextOverlay.Lines;
          let totalConfidence = 0;
          let totalWords = 0;

          for (const line of lines) {
            if (line.Words && line.Words.length > 0) {
              for (const word of line.Words) {
                if (word.WordConfidence) {
                  totalConfidence += parseFloat(word.WordConfidence);
                  totalWords++;
                }
              }
            }
          }

          ocrConfidence = totalWords > 0 ? totalConfidence / totalWords : 0;
        }
      }

      const extractedData = this.extractVehicleData(text);
      const analysis = this.performContentAnalysis(text, ocrConfidence);

      const confidence = this.calculateImageConfidence(analysis, extractedData);
      const status = this.determinateStatus(confidence);
      const issues = this.collectImageIssues(
        analysis,
        extractedData,
        ocrConfidence,
        confidence
      );

      return {
        type: 'IMAGE',
        status,
        confidence,
        isAuthentic: confidence >= 70,
        issues,
        extractedData,
        details: analysis,
        summary: this.generateSummary(status, confidence, issues),
        rawText: text.substring(0, 500),
      };
    } catch (error) {
      throw new Error(`Error al analizar imagen: ${error.message}`);
    }
  }

  performContentAnalysis(text, ocrConfidence = 85) {
    const textLower = text.toLowerCase();

    // terminos obligatorios? supongo jaja
    const requiredTerms = [
      { term: 'revisión técnica', weight: 20 },
      { term: 'vehículo', weight: 15 },
      { term: 'patente', weight: 20 },
      { term: 'motor', weight: 10 },
      { term: 'certificado', weight: 15 },
      { term: 'válido', weight: 10 },
      { term: 'propietario', weight: 10 },
    ];

    const foundTerms = [];
    let score = 0;

    for (const { term, weight } of requiredTerms) {
      if (textLower.includes(term)) {
        foundTerms.push(term);
        score += weight;
      }
    }

    const patentePattern = /[A-Z]{2,4}[\s-]?\d{2,4}/gi;
    const hasPatente = patentePattern.test(text);

    const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
    const dates = text.match(datePattern) || [];

    return {
      score,
      foundTerms,
      hasPatente,
      dateCount: dates.length,
      textLength: text.length,
      ocrConfidence: ocrConfidence,
      isValid: score >= 50 && hasPatente,
    };
  }

  analyzeMetadata(metadata) {
    const issues = [];

    if (!metadata) {
      issues.push('Sin metadatos');
      return { issues, hasMetadata: false };
    }

    const suspiciosSoftware = ['photoshop', 'gimp', 'paint', 'canva'];
    if (metadata.Creator) {
      for (const software of suspiciosSoftware) {
        if (metadata.Creator.toLowerCase().includes(software)) {
          issues.push(`Creado con software de edición: ${software}`);
        }
      }
    }

    return {
      issues,
      hasMetadata: metadata.Creator || 'No especificado',
      producer: metadata.Producer || 'No especificado',
    };
  }

  analyzeStructure(data) {
    const issues = [];

    if (data.numpages > 2) {
      issues.push('Numero de paginas sospechoso');
    }

    const hasStandardFormat =
      data.text.includes('CERTIFICADO DE REVISIÓN TÉCNICA') ||
      data.text.includes('REVISIÓN TÉCNICA');

    return {
      pageCount: data.numpages,
      hasStandardFormat,
      issues,
      isValid: issues.length === 0 && hasStandardFormat,
    };
  }

  async analyzeImageProperties(buffer) {
    const sharp = await import('sharp');
    const metadata = await sharp.default(buffer).metadata();

    const issues = [];

    if (metadata.width < 500 || metadata.length < 500) {
      issues.push('Imagen de baja resolucion');
    }

    if (!['jpeg', 'jpg'].includes(metadata.format)) {
      issues.push(`Formato de imagen inusual: ${metadata.format}`);
    }

    if (metadata.exif) {
      try {
        const exifData = metadata.exif.toString();
        if (exifData.includes('Photoshop') || exifData.includes('GIMP')) {
          issues.push('Imagen editada con software de edicion de imagenes');
        }
      } catch (error) {}
    }

    return {
      format: metadata.format,
      width: metadata.width,
      heigth: metadata.height,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space,
      hasExif: !!metadata.exif,
      issues,
      isValid: issues.length === 0,
    };
  }

  calculateConfidence(analysis, extractedData) {
    let baseScore = 0;

    baseScore += Math.min(40, analysis.score);

    const dataScore = Math.min(30, extractedData.camposCompletados * 5);
    baseScore += dataScore;

    if (extractedData.patente) baseScore += 10;
    if (
      extractedData.tipoVehiculo ||
      extractedData.marca ||
      extractedData.modelo
    )
      baseScore += 10;
    if (extractedData.dueno || extractedData.resultado) baseScore += 10;

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  calculateImageConfidence(analysis, extractedData) {
    let baseScore = 0;

    baseScore += Math.min(30, analysis.score);

    baseScore += Math.min(20, analysis.ocrConfidence / 5);

    const dataScore = Math.min(30, extractedData.camposCompletados * 5);
    baseScore += dataScore;

    if (extractedData.patente) baseScore += 7;
    if (extractedData.tipoVehiculo || extractedData.marca) baseScore += 7;
    if (extractedData.dueno || extractedData.resultado) baseScore += 6;

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  determinateStatus(confidence) {
    if (confidence >= 85) {
      return 'valid';
    } else if (confidence >= 70) {
      return 'probably_valid';
    } else if (confidence >= 50) {
      return 'suspicious';
    } else {
      return 'invalid';
    }
  }

  collectIssues(analysis, extractedData, confidence) {
    const issues = [];
    const threshold = 70;

    if (!extractedData.patente) {
      issues.push('No se detectó un número de patente válido');
    }

    if (
      !extractedData.tipoVehiculo &&
      !extractedData.marca &&
      !extractedData.modelo
    ) {
      issues.push('No se pudo identificar el tipo de vehículo, marca o modelo');
    }

    if (!extractedData.dueno) {
      issues.push('No se detectó información del propietario del vehículo');
    }

    if (!extractedData.resultado) {
      issues.push('No se detectó el resultado de la revisión técnica');
    }

    if (analysis.score < 50) {
      issues.push(
        'Faltan términos clave esperados en un certificado de revisión técnica'
      );
    }

    return confidence < threshold ? issues : [];
  }

  collectImageIssues(analysis, extractedData, ocrConfidence, confidence) {
    const issues = this.collectIssues(analysis, extractedData, confidence);
    const threshold = 70;

    if (ocrConfidence < 50) {
      issues.push(
        'Baja confianza en el texto extraído, posible imagen de baja calidad'
      );
    }

    if (analysis.textLength < 200) {
      issues.push('Cantidad insuficiente de texto reconocido en la imagen');
    }

    return confidence < threshold ? issues : [];
  }

  generateSummary(status, confidence, issues) {
    let summary = '';

    switch (status) {
      case 'valid':
        summary = `Documento válido con alta confianza (${confidence}%). `;
        break;
      case 'probably_valid':
        summary = `Documento probablemente válido (${confidence}%). Se detectaron algunos aspectos a revisar. `;
        break;
      case 'suspicious':
        summary = `Documento sospechoso (${confidence}%). Se detectaron varios problemas que podrían indicar adulteración. `;
        break;
      case 'invalid':
        summary = `Documento probablemente inválido (${confidence}%). Se detectaron múltiples problemas. `;
        break;
      default:
        summary = `Análisis inconcluso (${confidence}%). `;
        break;
    }

    if (issues.length > 0) {
      summary += `Problemas detectados: ${issues.join(', ')}`;
    }

    return summary;
  }

  extractVehicleData(text) {
    const extractedData = {};
    const textLower = text.toLowerCase();

    let patenteMatch = null;
    const placaPatenteRegex =
      /placa\s*patente\s*[:\s]*([A-Z0-9]{2,6}[-\s]*\d{2,4}|[A-Z]{2,6}[-\s]*\d{2,4})/i;
    const patenteRegex =
      /patente\s*[:\s]*([A-Z0-9]{2,6}[-\s]*\d{2,4}|[A-Z]{2,6}[-\s]*\d{2,4})/i;

    patenteMatch = text.match(placaPatenteRegex) || text.match(patenteRegex);
    if (patenteMatch && patenteMatch[1]) {
      extractedData.patente = patenteMatch[1].trim();
    } else {
      const generalPatentePattern = /[A-Z]{2,4}[\s-]?\d{2,4}/gi;
      const patenteMatches = text.match(generalPatentePattern);
      if (patenteMatches) {
        extractedData.patente = patenteMatches[0];
      }
    }

    const datePattern =
      /\d{1,2}[\/\-\s][a-zA-ZáéíóúÁÉÍÓÚ]*[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
    const dates = text.match(datePattern) || [];

    const fechaEmisionPattern =
      /fecha\s*:?\s*(\d{1,2}[\/\-\s][a-zA-ZáéíóúÁÉÍÓÚ]*[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const fechaEmisionMatch = text.match(fechaEmisionPattern);
    if (fechaEmisionMatch && fechaEmisionMatch[1]) {
      extractedData.fechaEmision = fechaEmisionMatch[1].trim();
    } else if (dates.length >= 1) {
      extractedData.fechaEmision = dates[0];
    }

    const fechaVencimientoPattern =
      /v[aá]lida\s*hasta\s*:?\s*(\d{1,2}[\/\-\s][a-zA-ZáéíóúÁÉÍÓÚ]*[\/\-\s]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const fechaVencimientoMatch = text.match(fechaVencimientoPattern);
    if (fechaVencimientoMatch && fechaVencimientoMatch[1]) {
      extractedData.fechaVencimiento = fechaVencimientoMatch[1].trim();
    } else if (dates.length >= 2) {
      extractedData.fechaVencimiento = dates[1];
    }

    const tipoVehiculoPatterns = [
      /veh[ií]culo\s*:?\s*([^\n\r,.;]+)/i,
      /tipo\s*de\s*veh[ií]culo\s*:?\s*([^\n\r,.;]+)/i,
      /tipo\s*:?\s*([^\n\r,.;]+)/i,
      /clase\s*:?\s*([^\n\r,.;]+)/i,
    ];

    for (const pattern of tipoVehiculoPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.tipoVehiculo = match[1].trim();
        break;
      }
    }

    const carroceriaPattern = /carrocer[ií]a\s*:?\s*([^\n\r,.;]+)/i;
    const carroceriaMatch = text.match(carroceriaPattern);
    if (carroceriaMatch && carroceriaMatch[1]) {
      if (extractedData.tipoVehiculo) {
        extractedData.tipoVehiculo += ` - CARROCERÍA: ${carroceriaMatch[1].trim()}`;
      } else {
        extractedData.tipoVehiculo = `CARROCERÍA: ${carroceriaMatch[1].trim()}`;
      }
    }

    const marcaPatterns = [
      /marca\s*:?\s*([^\n\r,.;]+)/i,
      /marca del veh[ií]culo\s*:?\s*([^\n\r,.;]+)/i,
    ];

    for (const pattern of marcaPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.marca = match[1].trim();
        break;
      }
    }

    const modeloPatterns = [
      /modelo\s*:?\s*([^\n\r,.;]+)/i,
      /modelo del veh[ií]culo\s*:?\s*([^\n\r,.;]+)/i,
    ];

    for (const pattern of modeloPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.modelo = match[1].trim();
        break;
      }
    }

    const duenoPatterns = [
      /propietario\s*:?\s*([^\n\r,.;]+)/i,
      /due[ñn]o\s*:?\s*([^\n\r,.;]+)/i,
      /nombre\s*:?\s*([^\n\r,.;]+)/i,
    ];

    for (const pattern of duenoPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.dueno = match[1].trim();
        break;
      }
    }

    let resultadoEncontrado = false;

    if (text.match(/aprobado[\s\n\r]*[xX✓]|[xX✓][\s\n\r]*aprobado/i)) {
      extractedData.resultado = 'APROBADO';
      resultadoEncontrado = true;
    } else if (text.match(/rechazado[\s\n\r]*[xX✓]|[xX✓][\s\n\r]*rechazado/i)) {
      extractedData.resultado = 'RECHAZADO';
      resultadoEncontrado = true;
    }

    if (!resultadoEncontrado) {
      const resultadoPatterns = [
        /resultado\s*:?\s*([^\n\r,.;]+)/i,
        /resultado:[\s\n\r]*(aprobado|rechazado)/i,
      ];

      for (const pattern of resultadoPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          extractedData.resultado = match[1].trim();
          resultadoEncontrado = true;
          break;
        }
      }
    }

    if (!resultadoEncontrado) {
      if (textLower.includes('aprobado') && !textLower.includes('rechazado')) {
        extractedData.resultado = 'APROBADO';
      } else if (
        textLower.includes('rechazado') &&
        !textLower.includes('aprobado')
      ) {
        extractedData.resultado = 'RECHAZADO';
      } else if (
        textLower.includes('aprobado') &&
        textLower.includes('rechazado')
      ) {
        const contextoAprobado = text.match(
          /[A-Z]{1,3}[\s\n\r]*aprobado|aprobado[\s\n\r]*[A-Z]{1,3}/i
        );
        const contextoRechazado = text.match(
          /[A-Z]{1,3}[\s\n\r]*rechazado|rechazado[\s\n\r]*[A-Z]{1,3}/i
        );

        if (contextoAprobado && !contextoRechazado) {
          extractedData.resultado = 'APROBADO';
        } else if (!contextoAprobado && contextoRechazado) {
          extractedData.resultado = 'RECHAZADO';
        } else {
          const posAprobado = textLower.indexOf('aprobado');
          const posRechazado = textLower.indexOf('rechazado');
          const cercanoAprobado = textLower.substring(
            Math.max(0, posAprobado - 20),
            posAprobado + 20
          );
          const cercanoRechazado = textLower.substring(
            Math.max(0, posRechazado - 20),
            posRechazado + 20
          );

          if (
            cercanoAprobado.includes('x') ||
            cercanoAprobado.includes('✓') ||
            cercanoAprobado.includes('•')
          ) {
            extractedData.resultado = 'APROBADO';
          } else if (
            cercanoRechazado.includes('x') ||
            cercanoRechazado.includes('✓') ||
            cercanoRechazado.includes('•')
          ) {
            extractedData.resultado = 'RECHAZADO';
          }
        }
      }
    }

    const anioPattern = /a[ñn]o\s*veh[ií]culo\s*:?\s*(\d{4})/i;
    const anioMatch = text.match(anioPattern);
    if (anioMatch && anioMatch[1]) {
      extractedData.anio = anioMatch[1].trim();
    }

    const motorPattern = /n[°º]\s*motor\s*:?\s*([^\n\r,.;]+)/i;
    const motorMatch = text.match(motorPattern);
    if (motorMatch && motorMatch[1]) {
      extractedData.motor = motorMatch[1].trim();
    }

    const chasisPattern = /n[°º]\s*chasis\s*:?\s*([^\n\r,.;]+)/i;
    const chasisMatch = text.match(chasisPattern);
    if (chasisMatch && chasisMatch[1]) {
      extractedData.chasis = chasisMatch[1].trim();
    }

    const validezPattern =
      /revisi[oó]n\s*t[eé]cnica\s*v[aá]lida\s*hasta\s*:?\s*([^\n\r,.;]+)/i;
    const validezMatch = text.match(validezPattern);
    if (validezMatch && validezMatch[1]) {
      extractedData.validezHasta = validezMatch[1].trim();
    }

    extractedData.camposCompletados = Object.keys(extractedData).filter(
      (key) => key !== 'camposCompletados'
    ).length;

    return extractedData;
  }
}

export default SimpleAnalyzer;
