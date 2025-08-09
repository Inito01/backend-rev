import fs from 'fs/promises';

class SimpleAnalyzer {
  async analyzeDocument(file) {
    try {
      if (file.mimetype === 'aplication/pdf') {
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
    const pdf = await import('pdf-parse');
    const buffer = await fs.readFile(file.path);
    const data = await pdf.default(buffer);

    const extractedData = this.extractKeyData(data.text);

    const analysis = {
      content: this.analyzeContent(data.text),
      metadata: this.analyzeMetadata(data.metadata),
      structure: this.analyzeStructure(data),
    };

    const confidence = this.calculateConfidence(analysis);
    const status = this.determinateStatus(confidence);
    const issues = this.collectIssues(analysis);

    return {
      type: 'PDF',
      status,
      confidence,
      isAuthentic: confidence >= 70,
      issues,
      extractedText: extractedData,
      details: analysis,
      summary: this.generateSummary(status, confidence, issues),
    };
  }

  async analyzeImage(file) {
    const Tesseract = await import('tesseract.js');
    const sharp = await import('sharp');

    const imageBuffer = await fs.readFile(file.path);

    const extractedData = this.extractKeyData(text);

    const processedBuffer = await sharp
      .default(imageBuffer)
      .resize(null, 1200, { withoutEnlargement: true })
      .greyscale()
      .normalise()
      .sharpen()
      .png()
      .toBuffer();

    const {
      data: { text, confidence: ocrConfidence },
    } = await Tesseract.recognize(processedBuffer, 'spa', {
      logger: () => {},
    });

    const analysis = {
      content: this.analyzeContent(text),
      ocr: { confidence: ocrConfidence, text: text.substring(0, 500) },
      image: await this.analyzeImageProperties(imageBuffer),
    };

    const confidence = this.calculateImageConfidence(analysis);
    const status = this.determinateStatus(confidence);
    const issues = this.collectImageIssues(analysis);

    return {
      type: 'IMAGE',
      status,
      confidence,
      isAuthentic: confidence >= 70,
      issues,
      extractedText: extractedData,
      details: analysis,
      summary: this.generateSummary(status, confidence, issues),
    };
  }

  analyzeContent(text) {
    const textLower = text.toLowerCase();

    // terminos obligatorios? supongo jaja
    const requiredTerms = [
      { term: 'revisión técnica', weight: 25 },
      { term: 'vehículo', weight: 15 },
      { term: 'patente', weight: 20 },
      { term: 'motor', weight: 10 },
      { term: 'certificado', weight: 15 },
      { term: 'válido', weight: 10 },
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

  calculateConfidence(analysis) {
    let baseScore = 0;

    baseScore += analysis.content.score / 2;

    if (
      analysis.metadata.hasMetadata &&
      analysis.metadata.issues.length === 0
    ) {
      baseScore += 25;
    } else {
      baseScore += Math.max(0, 25 - analysis.metadata.issues.length * 5);
    }

    if (analysis.structure.isValid) {
      baseScore += 25;
    } else {
      baseScore += Math.max(0, 25 - analysis.metadata.issues.length * 5);
    }

    return Math.min(100, Math.max(0, Math.round(baseScore)));
  }

  calculateImageConfidence(analysis) {
    let baseScore = 0;

    baseScore += analysis.content.score * 0.8;

    baseScore += (analysis.ocr.confidence / 100) * 20;

    if (analysis.image.isValid) {
      baseScore += 40;
    } else {
      baseScore += Math.max(0, 40 - analysis.image.issues.length * 10);
    }

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

  collectIssues(analysis) {
    const issues = [];

    if (!analysis.content.isValid) {
      if (!analysis.content.hasPatente) {
        issues.push('No se detecto un numero de patente valido');
      }
      if (analysis.content.score < 50) {
        issues.push(
          'Faltan terminos clave esperados en un certificado de revision tecnica'
        );
      }
    }

    if (analysis.metadata.issues.length > 0) {
      issues.push(...analysis.structure.issues);
    }

    return issues;
  }

  collectImageIssues(analysis) {
    const issues = [];

    if (!analysis.content.isValid) {
      if (!analysis.content.hasPatente) {
        issues.push('No se detecto un numero de patente valido');
      }
      if (analysis.content.score < 50) {
        issues.push(
          'Faltan terminos clave esperados en un certificado de revision tecnica'
        );
      }
    }

    if (analysis.ocr.confidence < 50) {
      issues.push(
        'Baja confianza en el texto extraido, posible documento de baja calidad o manipulado'
      );
    }

    if (analysis.image.issues.length > 0) {
      issues.push(...analysis.image.issues);
    }

    return issues;
  }

  generateSummary(status, confidence, issues) {
    let summary = '';

    switch (status) {
      case 'valid':
        summary = `Documento valido con alta confianza (${confidence}%). No se detectaron problemas.`;
        break;
      case 'probably_valid':
        summary = `Documento probablemente valido (${confidence}%). Se detectaron algunos aspectos a revisar.`;
        break;
      case 'suspicious':
        summary = `Documento sospechoso (${confidence}%). Se detectaron varios problemas que podrian indicar adulteracion.`;
        break;
      case 'invalid':
        summary = `Documento probablemente invalido (${confidence}%). Se detectaron multiples problemas.`;
        break;
      default:
        summary = `Analisis inconcluso (${confidence}%).`;
        break;
    }

    if (issues.length > 0) {
      summary += `Problemas detectados: ${issues.join(', ')}`;
    }

    return summary;
  }

  extractKeyData(text) {
    const extractedData = {};

    const patentePattern = /[A-Z]{2,4}[\s-]?\d{2,4}/gi;
    const patenteMatch = text.match(patentePattern);
    if (patenteMatch) {
      extractedData.patente = patenteMatch[0];
    }

    const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
    const dates = text.match(datePattern) || [];
    if (dates.length >= 1) {
      extractedData.fechaEmision = dates[0];
    }
    if (dates.length >= 2) {
      extractedData.fechaVencimiento = dates[0];
    }

    const tipoVehiculoPattern = /tipo\s*de\s*vehículo\s*:\s*([^\n\r,.;]+)/i;
    const tipoMatch = text.match(tipoVehiculoPattern);
    if (tipoMatch && tipoMatch[1]) {
      extractedData.tipoVehiculo = tipoMatch[1].trim();
    }

    const marcaPatter = /marca\s*:\s*([^\n\r,.;]+)/i;
    const marcaMatch = text.match(marcaPatter);
    if (marcaMatch && marcaMatch[1]) {
      extractedData.marca = extractedData[1].trim();
    }

    const modeloPattern = /modelo\s*:\s*([^\n\r,.;]+)/i;
    const modeloMatch = text.match(modeloPattern);
    if (modeloMatch && modeloMatch[1]) {
      extractedData.modelo = modeloMatch[1].trim();
    }

    const resultadoPattern = /resultado\s*:\s*([^\n\r,.;]+)/i;
    const resultadoMatch = text.match(resultadoPattern);
    if (resultadoMatch && resultadoMatch[1]) {
      extractedData.resultado = resultadoMatch[1].trim();
    }

    return extractedData;
  }
}

export default SimpleAnalyzer;
