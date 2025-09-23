import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Paper,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Code as JsonIcon,
  Backup as BackupIcon,
  Storage as DataIcon,
  TrendingUp as AnalyticsIcon,
  FitnessCenter as WorkoutIcon,
  LocalDining as NutritionIcon,
  Timer as TimerIcon,
  Psychology as MoodIcon
} from '@mui/icons-material';

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  dataTypes: string[];
  dateRange: 'all' | 'last30' | 'last90' | 'custom';
  startDate?: Date;
  endDate?: Date;
  includeCharts: boolean;
  includePhotos: boolean;
}

const DataExportPage: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dataTypes: ['workouts'],
    dateRange: 'last30',
    includeCharts: false,
    includePhotos: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [backupProgress, setBackupProgress] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const dataTypeOptions = [
    { key: 'workouts', label: 'Workouts & Exercise Routines', icon: WorkoutIcon },
    { key: 'sports', label: 'Sports Training Sessions', icon: TimerIcon },
    { key: 'nutrition', label: 'Nutrition & Meal Tracking', icon: NutritionIcon },
    { key: 'health', label: 'Health Metrics & Vitals', icon: DataIcon },
    { key: 'mood', label: 'Performance Diary & Mood', icon: MoodIcon },
    { key: 'analytics', label: 'Progress Analytics', icon: AnalyticsIcon }
  ];

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    if (checked) {
      setExportOptions(prev => ({
        ...prev,
        dataTypes: [...prev.dataTypes, dataType]
      }));
    } else {
      setExportOptions(prev => ({
        ...prev,
        dataTypes: prev.dataTypes.filter(type => type !== dataType)
      }));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Wait for progress to complete
      await new Promise(resolve => setTimeout(resolve, 2200));

      // Generate mock file based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `fitness-data-${timestamp}.${exportOptions.format}`;
      
      let content = '';
      let mimeType = '';
      
      switch (exportOptions.format) {
        case 'csv':
          content = generateCSVContent();
          mimeType = 'text/csv';
          break;
        case 'json':
          content = generateJSONContent();
          mimeType = 'application/json';
          break;
        case 'pdf':
          content = 'PDF generation would require additional libraries like jsPDF';
          mimeType = 'application/pdf';
          break;
      }

      // Create and download file (mock)
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlertMessage(`Successfully exported ${exportOptions.dataTypes.length} data types to ${fileName}`);
      setShowAlert(true);
    } catch (error) {
      setAlertMessage('Export failed. Please try again.');
      setShowAlert(true);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateCSVContent = () => {
    let csv = '';
    exportOptions.dataTypes.forEach(dataType => {
      csv += `${dataType.toUpperCase()} DATA\n`;
      csv += 'Date,Type,Duration,Notes\n';
      csv += '2024-01-15,Basketball Shooting,45,Good session\n';
      csv += '2024-01-14,Football Drills,60,Need to work on speed\n';
      csv += '\n';
    });
    return csv;
  };

  const generateJSONContent = () => {
    const data = {
      exportDate: new Date().toISOString(),
      dateRange: exportOptions.dateRange,
      dataTypes: exportOptions.dataTypes,
      data: {
        sports: [
          {
            date: '2024-01-15',
            sport: 'basketball',
            category: 'shooting',
            duration: 45,
            quality: 8,
            notes: 'Good session'
          }
        ],
        workouts: [
          {
            date: '2024-01-14',
            name: 'Upper Body Strength',
            exercises: [
              { name: 'Push-ups', sets: 3, reps: 15 },
              { name: 'Pull-ups', sets: 3, reps: 8 }
            ]
          }
        ]
      }
    };
    return JSON.stringify(data, null, 2);
  };

  const handleBackup = async () => {
    setBackupProgress(0);
    setShowBackupDialog(true);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowBackupDialog(false);
            setAlertMessage('Backup completed successfully to cloud storage');
            setShowAlert(true);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const getEstimatedFileSize = () => {
    const baseSize = exportOptions.dataTypes.length * 50; // KB per data type
    const multiplier = exportOptions.format === 'pdf' ? 3 : 1;
    const photosSize = exportOptions.includePhotos ? 2000 : 0; // KB
    return Math.round((baseSize * multiplier + photosSize) / 1024 * 10) / 10; // MB
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Export & Backup
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Export your fitness data or create backups for safekeeping
      </Typography>

      <Grid container spacing={3}>
        {/* Export Configuration */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Configuration
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    >
                      <MenuItem value="csv">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CsvIcon /> CSV (Spreadsheet)
                        </Box>
                      </MenuItem>
                      <MenuItem value="json">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <JsonIcon /> JSON (Data)
                        </Box>
                      </MenuItem>
                      <MenuItem value="pdf">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PdfIcon /> PDF (Report)
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={exportOptions.dateRange}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    >
                      <MenuItem value="last30">Last 30 Days</MenuItem>
                      <MenuItem value="last90">Last 90 Days</MenuItem>
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="custom">Custom Range</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Data Types to Include
                  </Typography>
                  <List>
                    {dataTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <ListItem key={option.key} dense>
                          <ListItemIcon>
                            <Icon />
                          </ListItemIcon>
                          <ListItemText primary={option.label} />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={exportOptions.dataTypes.includes(option.key)}
                                onChange={(e) => handleDataTypeChange(option.key, e.target.checked)}
                              />
                            }
                            label=""
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>

                {exportOptions.format === 'pdf' && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includeCharts}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        />
                      }
                      label="Include charts and graphs"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportOptions.includePhotos}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                        />
                      }
                      label="Include progress photos"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Export Summary & Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Format: <strong>{exportOptions.format.toUpperCase()}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data Types: <strong>{exportOptions.dataTypes.length}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date Range: <strong>{exportOptions.dateRange}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated Size: <strong>{getEstimatedFileSize()} MB</strong>
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                {exportOptions.dataTypes.map(type => (
                  <Chip
                    key={type}
                    label={type}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={isExporting || exportOptions.dataTypes.length === 0}
                sx={{ mb: 2 }}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              {isExporting && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Export Progress: {exportProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={exportProgress} />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Cloud Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a secure backup of all your data in the cloud
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BackupIcon />}
                onClick={handleBackup}
              >
                Create Backup
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Exports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Exports
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CsvIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="fitness-data-2024-01-15.csv"
                    secondary="All data types • 2.3 MB • Downloaded 3 days ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PdfIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="monthly-report-december.pdf"
                    secondary="Performance report • 8.7 MB • Downloaded 1 week ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BackupIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Full backup"
                    secondary="All data • Cloud storage • Created 2 weeks ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Progress Dialog */}
      <Dialog open={showBackupDialog} disableEscapeKeyDown>
        <DialogTitle>Creating Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {backupProgress}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uploading your data to secure cloud storage...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={backupProgress} 
              sx={{ mt: 2, width: '100%' }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Success/Error Alert */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataExportPage;
