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
      extractedText: data.text.substring(0, 300),
      details: analysis,
      summary: this.generateSummary(status, confidence, issues),
    };
  }

  async analyzeImage(file) {
    const Tesseract = await import('tesseract.js');
    const sharp = await import('sharp');

    const imageBuffer = await fs.readFile(file.path);

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
      extractedText: text.substring(0, 300),
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

  analyzeStructure(data) {}

  async analyzeImageProperties(buffer) {}

  calculateConfidence(analysis) {}

  calculateImageConfidence(analysis) {}

  determinateStatus(analysis) {}

  collectIssues(analysis) {}

  collectImageIssues(analysis) {}

  generateSummary(status, confidence, issues) {}
}

export default SimpleAnalyzer;
