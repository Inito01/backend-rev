import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const Document = sequelize.define(
  'Document',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('valid', 'invalid', 'suspicious', 'probably_valid'),
      allowNull: false,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    analysisDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('analysisDetails');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('analysisDetails', JSON.stringify(value));
      },
    },
    extractedData: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('extractedData');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('extractedData', JSON.stringify(value));
      },
    },
    issues: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('issues');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('issues', JSON.stringify(value));
      },
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Document;
