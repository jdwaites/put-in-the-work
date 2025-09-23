import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  FitnessCenter as WorkoutIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface ReportConfig {
  type: 'weekly' | 'monthly' | 'custom';
  sports: string[];
  includeCharts: boolean;
  includeProgress: boolean;
  includeGoals: boolean;
  format: 'pdf' | 'email';
}

const ReporterPage: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'monthly',
    sports: ['basketball', 'football'],
    includeCharts: true,
    includeProgress: true,
    includeGoals: true,
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSportChange = (sport: string, checked: boolean) => {
    if (checked) {
      setReportConfig(prev => ({
        ...prev,
        sports: [...prev.sports, sport]
      }));
    } else {
      setReportConfig(prev => ({
        ...prev,
        sports: prev.sports.filter(s => s !== sport)
      }));
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  // Mock data for demonstration
  const reportPreview = {
    title: 'Monthly Training Report',
    period: 'September 1-30, 2025',
    summary: {
      totalSessions: 27,
      totalTime: '830 minutes',
      avgQuality: '7.0/10',
      improvement: '+18%'
    },
    sports: {
      basketball: {
        sessions: 15,
        time: 450,
        topSkills: ['Shooting', 'Dribbling', 'Defense'],
        improvement: '+15%'
      },
      football: {
        sessions: 12,
        time: 380,
        topSkills: ['Route Running', 'Catching', 'Conditioning'],
        improvement: '+22%'
      }
    },
    achievements: [
      '7-Day Training Streak',
      'Quality Master (5 sessions with 9+ rating)',
      'Consistency Champion'
    ],
    goals: {
      completed: 3,
      total: 5,
      details: [
        { goal: 'Train 20+ times this month', status: 'completed' },
        { goal: 'Improve shooting quality to 8+', status: 'completed' },
        { goal: 'Complete football conditioning program', status: 'in-progress' }
      ]
    }
  };

  const recentReports = [
    { name: 'August 2025 Monthly Report', date: '2025-09-01', type: 'Monthly', size: '2.3 MB' },
    { name: 'Basketball Skills Assessment', date: '2025-08-25', type: 'Custom', size: '1.8 MB' },
    { name: 'Weekly Progress - Week 34', date: '2025-08-20', type: 'Weekly', size: '950 KB' },
    { name: 'Football Training Analysis', date: '2025-08-15', type: 'Custom', size: '1.2 MB' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progress Reporter
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate comprehensive training reports to track progress and share achievements
      </Typography>

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Report Configuration
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportConfig.type}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="weekly">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      Weekly Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="monthly">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      Monthly Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="custom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportIcon fontSize="small" />
                      Custom Report
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Sports to Include
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('basketball')}
                    onChange={(e) => handleSportChange('basketball', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BasketballIcon fontSize="small" />
                    Basketball
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('football')}
                    onChange={(e) => handleSportChange('football', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FootballIcon fontSize="small" />
                    Football
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.sports.includes('general')}
                    onChange={(e) => handleSportChange('general', e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkoutIcon fontSize="small" />
                    General Fitness
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Report Content
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeCharts}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  />
                }
                label="Include Charts & Graphs"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeProgress}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeProgress: e.target.checked }))}
                  />
                }
                label="Progress Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reportConfig.includeGoals}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, includeGoals: e.target.checked }))}
                  />
                }
                label="Goals & Achievements"
              />

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={reportConfig.format}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon fontSize="small" />
                      PDF Document
                    </Box>
                  </MenuItem>
                  <MenuItem value="email">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      Email Report
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <ReportIcon />}
                onClick={generateReport}
                disabled={isGenerating || reportConfig.sports.length === 0}
                sx={{ mt: 3 }}
              >
                {isGenerating ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Preview */}
        <Grid item xs={12} md={6}>
          {showPreview ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Report Preview
                </Typography>

                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h5" gutterBottom>
                    {reportPreview.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {reportPreview.period}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {reportPreview.summary.totalSessions}
                        </Typography>
                        <Typography variant="caption">Sessions</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {reportPreview.summary.improvement}
                        </Typography>
                        <Typography variant="caption">Improvement</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Sports Breakdown
                  </Typography>
                  {Object.entries(reportPreview.sports).map(([sport, data]) => (
                    <Box key={sport} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{sport.charAt(0).toUpperCase() + sport.slice(1)}:</strong> {data.sessions} sessions, {data.time} min
                      </Typography>
                    </Box>
                  ))}

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Recent Achievements
                  </Typography>
                  {reportPreview.achievements.map((achievement, index) => (
                    <Chip
                      key={index}
                      label={achievement}
                      size="small"
                      icon={<StarIcon />}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Paper>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<PdfIcon />}
                    size="small"
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    size="small"
                  >
                    Email
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    size="small"
                  >
                    Share
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Report Preview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your report settings and click "Generate Report" to see a preview
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date Created</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentReports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PdfIcon fontSize="small" />
                            {report.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={report.type} size="small" />
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>
                          <Button size="small" startIcon={<PdfIcon />}>
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReporterPage;
