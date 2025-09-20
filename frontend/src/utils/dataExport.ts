import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// Storage utility to get fitness data
const storage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }
};

export interface ExportData {
  weights: Array<{ date: string; value: number; timestamp: number }>;
  sleepLog: Array<{ date: string; value: number; timestamp: number }>;
  workouts: Array<{ date: string; type: string; duration: number; timestamp: number }>;
  routines: Array<{ name: string; exercises: any[]; created: string }>;
  diary: Array<{ date: string; mood: number; energy: number; notes: string; timestamp: number }>;
}

export class DataExportService {
  
  // Get all fitness data
  private getFitnessData(): ExportData {
    const fitnessData = storage.get('fitnessData', {
      weightHistory: [],
      sleepHistory: [],
      workoutHistory: []
    });
    
    const routines = storage.get('exerciseRoutines', []);
    const diary = storage.get('performanceDiary', []);
    
    return {
      weights: fitnessData.weightHistory || [],
      sleepLog: fitnessData.sleepHistory || [],
      workouts: fitnessData.workoutHistory || [],
      routines: routines,
      diary: diary
    };
  }
  
  // Export data to CSV
  exportToCSV(dataType: 'all' | 'weights' | 'sleep' | 'workouts' | 'diary' = 'all') {
    const data = this.getFitnessData();
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (dataType === 'all') {
      // Create comprehensive CSV with all data
      const allData = [
        ...data.weights.map(w => ({ 
          type: 'Weight', 
          date: w.date, 
          value: w.value, 
          unit: 'lbs',
          notes: ''
        })),
        ...data.sleepLog.map(s => ({ 
          type: 'Sleep', 
          date: s.date, 
          value: s.value, 
          unit: 'hours',
          notes: ''
        })),
        ...data.workouts.map(w => ({ 
          type: 'Workout', 
          date: w.date, 
          value: w.duration || 0, 
          unit: 'minutes',
          notes: w.type || ''
        })),
        ...data.diary.map(d => ({ 
          type: 'Diary', 
          date: d.date, 
          value: d.mood, 
          unit: 'mood/10',
          notes: `Energy: ${d.energy}/10, Notes: ${d.notes}`
        }))
      ];
      
      const csv = Papa.unparse(allData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `fitness-data-all-${timestamp}.csv`);
    } else {
      // Export specific data type
      let exportData: any[] = [];
      let filename = '';
      
      switch (dataType) {
        case 'weights':
          exportData = data.weights;
          filename = `weight-data-${timestamp}.csv`;
          break;
        case 'sleep':
          exportData = data.sleepLog;
          filename = `sleep-data-${timestamp}.csv`;
          break;
        case 'workouts':
          exportData = data.workouts;
          filename = `workout-data-${timestamp}.csv`;
          break;
        case 'diary':
          exportData = data.diary;
          filename = `diary-data-${timestamp}.csv`;
          break;
      }
      
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);
    }
  }
  
  // Export progress report to PDF
  async exportProgressReportPDF() {
    const data = this.getFitnessData();
    const pdf = new jsPDF();
    const timestamp = new Date().toLocaleDateString();
    
    // Title
    pdf.setFontSize(20);
    pdf.text('Fitness Progress Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${timestamp}`, 20, 45);
    
    // Summary Statistics
    pdf.setFontSize(16);
    pdf.text('Progress Summary', 20, 65);
    
    pdf.setFontSize(12);
    let yPosition = 80;
    
    // Weight progress
    if (data.weights.length > 0) {
      const latestWeight = data.weights[data.weights.length - 1];
      const firstWeight = data.weights[0];
      const weightChange = latestWeight.value - firstWeight.value;
      
      pdf.text(`Current Weight: ${latestWeight.value} lbs`, 20, yPosition);
      yPosition += 15;
      pdf.text(`Weight Change: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} lbs`, 20, yPosition);
      yPosition += 15;
      pdf.text(`Total Weight Entries: ${data.weights.length}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Sleep data
    if (data.sleepLog.length > 0) {
      const avgSleep = data.sleepLog.reduce((sum, s) => sum + s.value, 0) / data.sleepLog.length;
      pdf.text(`Average Sleep: ${avgSleep.toFixed(1)} hours`, 20, yPosition);
      yPosition += 15;
      pdf.text(`Sleep Entries: ${data.sleepLog.length}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Workout data
    if (data.workouts.length > 0) {
      pdf.text(`Total Workouts: ${data.workouts.length}`, 20, yPosition);
      yPosition += 15;
      
      const totalDuration = data.workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
      pdf.text(`Total Workout Time: ${Math.round(totalDuration)} minutes`, 20, yPosition);
      yPosition += 20;
    }
    
    // Routines
    if (data.routines.length > 0) {
      pdf.text(`Exercise Routines Created: ${data.routines.length}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Recent diary entries
    if (data.diary.length > 0) {
      pdf.setFontSize(16);
      pdf.text('Recent Performance Notes', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      const recentEntries = data.diary.slice(-5);
      recentEntries.forEach(entry => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.text(`${entry.date}: Mood ${entry.mood}/10, Energy ${entry.energy}/10`, 20, yPosition);
        yPosition += 12;
        
        if (entry.notes) {
          const notes = pdf.splitTextToSize(entry.notes, 170);
          pdf.text(notes, 25, yPosition);
          yPosition += notes.length * 5 + 5;
        }
      });
    }
    
    pdf.save(`fitness-progress-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  // Import data from CSV
  importFromCSV(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const importedData = results.data;
            // Process and validate imported data
            resolve(importedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  // Get export statistics
  getExportStatistics() {
    const data = this.getFitnessData();
    
    return {
      totalEntries: data.weights.length + data.sleepLog.length + data.workouts.length + data.diary.length,
      weightEntries: data.weights.length,
      sleepEntries: data.sleepLog.length,
      workoutEntries: data.workouts.length,
      diaryEntries: data.diary.length,
      routines: data.routines.length,
      dataSize: JSON.stringify(data).length,
      lastUpdated: data.weights.length > 0 ? new Date(Math.max(...data.weights.map(w => w.timestamp))).toLocaleDateString() : 'No data'
    };
  }
}

export const dataExportService = new DataExportService();